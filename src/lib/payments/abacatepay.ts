import { PaymentRequest, PaymentResponse } from '@/types/payment'

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY || ''
const AUTO_SIMULATE = process.env.ABACATEPAY_AUTO_SIMULATE !== 'false' // default: true

export async function processAbacatePayPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Verificar se está em modo de teste (sem chave configurada)
  if (!ABACATEPAY_API_KEY || ABACATEPAY_API_KEY === 'test_key') {
    return processTestPayment(request)
  }

  switch (request.method) {
    case 'pix':
      return processPixPayment(request)
    case 'credit_card':
      return processCreditCardPayment(request)
    case 'boleto':
      return {
        success: false,
        message: 'Boleto ainda não disponível no AbacatePay',
      }
    default:
      return {
        success: false,
        message: `Método de pagamento não suportado: ${request.method}`,
      }
  }
}

async function processPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Verificar se temos todos os dados do customer (todos são obrigatórios na API)
    const hasCompleteCustomer =
      request.customer?.name &&
      request.customer?.email &&
      request.customer?.document

    // Usar API de QRCode PIX diretamente (suporta simulação no Dev Mode)
    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount, // em centavos
        expiresIn: 3600, // 1 hora
        description: `Pagamento - ${request.customer?.name || 'Cliente'}`,
        ...(hasCompleteCustomer && {
          customer: {
            name: request.customer!.name,
            email: request.customer!.email,
            cellphone: '+5511999999999',
            taxId: request.customer!.document.replace(/\D/g, ''),
          },
        }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        message: `Erro ao criar QR Code PIX: ${error}`,
      }
    }

    const data = await response.json()
    const pixData = data.data

    // Em Dev Mode, simular o pagamento automaticamente (se AUTO_SIMULATE = true)
    if (pixData.devMode && AUTO_SIMULATE) {
      console.log('🔄 Dev Mode detectado - simulando pagamento automaticamente...')
      const simulateResult = await simulatePixPayment(pixData.id)

      if (simulateResult.success) {
        console.log('✅ Pagamento simulado com sucesso!')
        return {
          success: true,
          message: 'Pagamento PIX simulado com sucesso! (Dev Mode)',
          data: {
            transaction_id: pixData.id,
            status: 'paid',
            pix_code: pixData.brCode,
            pix_qr_code: pixData.brCodeBase64?.replace('data:image/png;base64,', ''),
            amount: pixData.amount,
            expires_at: pixData.expiresAt,
            simulated: true,
            provider_response: simulateResult.data,
          },
        }
      }
    }

    return {
      success: true,
      message: 'QR Code PIX criado com sucesso!',
      data: {
        transaction_id: pixData.id,
        status: mapStatus(pixData.status),
        pix_code: pixData.brCode,
        pix_qr_code: pixData.brCodeBase64?.replace('data:image/png;base64,', ''),
        amount: pixData.amount,
        expires_at: pixData.expiresAt,
        provider_response: pixData,
      },
    }
  } catch (error) {
    console.error('AbacatePay PIX Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao processar pagamento',
    }
  }
}

async function processCreditCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Usar API REST diretamente para melhor controle de erros
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['CARD'],
        products: [
          {
            externalId: `prod-${Date.now()}`,
            name: 'Pagamento de teste',
            quantity: 1,
            price: request.amount,
          },
        ],
        returnUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        completionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transactions`,
        customer: {
          name: request.customer?.name || 'Cliente Teste',
          email: request.customer?.email || 'cliente@teste.com',
          cellphone: '+5511999999999',
          taxId: request.customer?.document?.replace(/\D/g, '') || '00000000000',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AbacatePay Card API Error:', errorText)
      return {
        success: false,
        message: `Cartão não disponível: ${response.status === 400 ? 'método em beta, contate o suporte' : errorText}`,
      }
    }

    const data = await response.json()

    if (data.error || !data.data) {
      return {
        success: false,
        message: data.error || 'Erro ao criar cobrança com cartão',
      }
    }

    const billing = data.data

    return {
      success: true,
      message: 'Cobrança criada! Clique no botão para pagar.',
      data: {
        transaction_id: billing.id,
        status: mapStatus(billing.status),
        payment_url: billing.url,
        amount: billing.amount,
        dev_mode: billing.devMode,
        provider_response: billing,
      },
    }
  } catch (error) {
    console.error('AbacatePay Card Error:', error)
    return {
      success: false,
      message: 'Erro ao processar cartão. O método pode não estar disponível para sua conta.',
    }
  }
}

function mapStatus(
  abacateStatus: string
): 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled' {
  const statusMap: Record<
    string,
    'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  > = {
    PENDING: 'pending',
    EXPIRED: 'failed',
    CANCELLED: 'cancelled',
    PAID: 'paid',
    REFUNDED: 'refunded',
  }
  return statusMap[abacateStatus] || 'pending'
}

// Simular pagamento PIX no Dev Mode do AbacatePay
export async function simulatePixPayment(pixQrCodeId: string): Promise<{
  success: boolean
  message: string
  data?: unknown
}> {
  if (!ABACATEPAY_API_KEY) {
    return {
      success: false,
      message: 'API Key não configurada. Configure ABACATEPAY_API_KEY no .env.local',
    }
  }

  try {
    const response = await fetch(
      `https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=${pixQrCodeId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: {} }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        message: `Erro ao simular pagamento: ${error}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: 'Pagamento simulado com sucesso!',
      data,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao simular pagamento',
    }
  }
}

// Função de teste para quando não há chave configurada
async function processTestPayment(request: PaymentRequest): Promise<PaymentResponse> {
  console.log('⚠️ Modo de teste ativo - configure ABACATEPAY_API_KEY para usar a API real')

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const transactionId = 'test_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

  switch (request.method) {
    case 'pix':
      return {
        success: true,
        message: 'Cobrança Pix criada! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          payment_url: `https://abacatepay.com/pay/${transactionId}`,
          pix_code: '00020126580014br.gov.bcb.pix0136abacate-test-key520400005303986',
          test_mode: true,
        },
      }
    case 'credit_card':
      return {
        success: true,
        message: 'Cobrança criada! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          payment_url: `https://abacatepay.com/pay/${transactionId}`,
          test_mode: true,
        },
      }
    case 'boleto':
      return {
        success: false,
        message: 'Boleto não disponível no AbacatePay (MODO TESTE)',
      }
    default:
      return {
        success: false,
        message: `Método não suportado: ${request.method}`,
      }
  }
}
