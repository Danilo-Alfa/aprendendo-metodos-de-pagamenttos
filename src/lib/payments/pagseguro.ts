import { PaymentRequest, PaymentResponse } from '@/types/payment'

const PAGSEGURO_API_URL = process.env.PAGSEGURO_SANDBOX === 'true'
  ? 'https://sandbox.api.pagseguro.com'
  : 'https://api.pagseguro.com'

const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN || ''

interface PagSeguroOrderResponse {
  id: string
  reference_id: string
  created_at: string
  customer: {
    name: string
    email: string
    tax_id: string
  }
  items: Array<{
    name: string
    quantity: number
    unit_amount: number
  }>
  qr_codes?: Array<{
    id: string
    expiration_date: string
    text: string
    amount: {
      value: number
    }
    links: Array<{
      rel: string
      href: string
      media: string
      type: string
    }>
  }>
  charges?: Array<{
    id: string
    reference_id: string
    status: string
    created_at: string
    amount: {
      value: number
      currency: string
      summary: {
        total: number
        paid: number
        refunded: number
      }
    }
    payment_response?: {
      code: string
      message: string
    }
    payment_method: {
      type: string
    }
  }>
  links: Array<{
    rel: string
    href: string
    media: string
    type: string
  }>
}

async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: unknown
): Promise<{ success: boolean; data?: PagSeguroOrderResponse; error?: string }> {
  if (!PAGSEGURO_TOKEN) {
    return {
      success: false,
      error: 'PAGSEGURO_TOKEN não configurado. Configure no arquivo .env.local',
    }
  }

  try {
    const response = await fetch(`${PAGSEGURO_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGSEGURO_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PagSeguro API Error:', data)
      const errorMsg = data.error_messages?.[0]?.description || data.message || `Erro na API: ${response.status}`
      return {
        success: false,
        error: errorMsg,
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('PagSeguro Request Error:', error)
    return {
      success: false,
      error: 'Erro de conexão com o PagSeguro',
    }
  }
}

export async function processPagSeguroPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Verificar se está em modo de teste (sem token configurado)
  if (!PAGSEGURO_TOKEN || PAGSEGURO_TOKEN === 'test_token') {
    return processTestPayment(request)
  }

  switch (request.method) {
    case 'pix':
      return processPixPayment(request)
    case 'credit_card':
      return processCreditCardPayment(request)
    case 'boleto':
      return processBoletoPayment(request)
    default:
      return {
        success: false,
        message: `Método de pagamento não suportado: ${request.method}`,
      }
  }
}

async function processPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const expirationDate = new Date()
  expirationDate.setHours(expirationDate.getHours() + 24) // 24 horas

  const orderRequest = {
    reference_id: `order-${Date.now()}`,
    customer: {
      name: request.customer?.name || 'Cliente',
      email: request.customer?.email || 'cliente@email.com',
      tax_id: request.customer?.document?.replace(/\D/g, '') || '00000000000',
      phones: [
        {
          country: '55',
          area: '11',
          number: '999999999',
          type: 'MOBILE',
        },
      ],
    },
    items: [
      {
        name: 'Pagamento via PIX',
        quantity: 1,
        unit_amount: request.amount,
      },
    ],
    qr_codes: [
      {
        amount: {
          value: request.amount,
        },
        expiration_date: expirationDate.toISOString(),
      },
    ],
    notification_urls: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/pagseguro`,
    ],
  }

  const result = await makeRequest('/orders', 'POST', orderRequest)

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Erro ao criar PIX',
    }
  }

  const qrCode = result.data?.qr_codes?.[0]
  const qrCodeImageLink = qrCode?.links?.find((l) => l.rel === 'QRCODE.PNG')

  // Buscar imagem do QR Code em base64
  let qrCodeBase64: string | undefined
  if (qrCodeImageLink?.href) {
    try {
      const imgResponse = await fetch(qrCodeImageLink.href)
      const buffer = await imgResponse.arrayBuffer()
      qrCodeBase64 = Buffer.from(buffer).toString('base64')
    } catch {
      console.error('Erro ao buscar QR Code image')
    }
  }

  return {
    success: true,
    message: 'QR Code PIX gerado com sucesso!',
    data: {
      transaction_id: result.data?.id,
      status: 'pending',
      pix_qr_code: qrCodeBase64,
      pix_code: qrCode?.text,
      expires_at: qrCode?.expiration_date,
      provider_response: result.data,
    },
  }
}

async function processCreditCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // PagSeguro requer cartão encriptado via SDK do frontend
  // Para ambiente de teste, retornamos uma mensagem explicativa
  return {
    success: false,
    message: 'Cartão de crédito no PagSeguro requer encriptação via SDK do frontend. Use o checkout transparente ou o link de pagamento.',
  }
}

async function processBoletoPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3) // Vence em 3 dias

  const orderRequest = {
    reference_id: `order-${Date.now()}`,
    customer: {
      name: request.customer?.name || 'Cliente',
      email: request.customer?.email || 'cliente@email.com',
      tax_id: request.customer?.document?.replace(/\D/g, '') || '00000000000',
      phones: [
        {
          country: '55',
          area: '11',
          number: '999999999',
          type: 'MOBILE',
        },
      ],
    },
    items: [
      {
        name: 'Pagamento via Boleto',
        quantity: 1,
        unit_amount: request.amount,
      },
    ],
    charges: [
      {
        reference_id: `charge-${Date.now()}`,
        description: 'Pagamento via Boleto',
        amount: {
          value: request.amount,
          currency: 'BRL',
        },
        payment_method: {
          type: 'BOLETO',
          boleto: {
            due_date: dueDate.toISOString().split('T')[0],
            instruction_lines: {
              line_1: 'Pagamento processado via PagSeguro',
              line_2: 'Não receber após o vencimento',
            },
            holder: {
              name: request.customer?.name || 'Cliente',
              tax_id: request.customer?.document?.replace(/\D/g, '') || '00000000000',
              email: request.customer?.email || 'cliente@email.com',
              address: {
                street: 'Rua Exemplo',
                number: '123',
                locality: 'Centro',
                city: 'São Paulo',
                region_code: 'SP',
                country: 'BRA',
                postal_code: '01310100',
              },
            },
          },
        },
      },
    ],
    notification_urls: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/pagseguro`,
    ],
  }

  const result = await makeRequest('/orders', 'POST', orderRequest)

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Erro ao gerar boleto',
    }
  }

  const charge = result.data?.charges?.[0]
  const boletoLink = charge ? result.data?.links?.find((l) => l.rel === 'PAY') : null

  return {
    success: true,
    message: 'Boleto gerado com sucesso!',
    data: {
      transaction_id: result.data?.id,
      charge_id: charge?.id,
      status: 'pending',
      boleto_url: boletoLink?.href,
      due_date: dueDate.toISOString(),
      provider_response: result.data,
    },
  }
}

function mapStatus(pagseguroStatus: string): 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled' {
  const statusMap: Record<string, 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled'> = {
    WAITING: 'pending',
    IN_ANALYSIS: 'processing',
    AUTHORIZED: 'processing',
    PAID: 'paid',
    AVAILABLE: 'paid',
    DISPUTE: 'processing',
    REFUNDED: 'refunded',
    CANCELED: 'cancelled',
    DECLINED: 'failed',
  }
  return statusMap[pagseguroStatus] || 'pending'
}

// Função de teste para quando não há token configurado
async function processTestPayment(request: PaymentRequest): Promise<PaymentResponse> {
  console.log('⚠️ Modo de teste ativo - configure PAGSEGURO_TOKEN para usar a API real')

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const transactionId = 'test_ps_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

  switch (request.method) {
    case 'pix':
      return {
        success: true,
        message: 'QR Code PIX gerado! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          pix_code: '00020126580014br.gov.bcb.pix0136pagseguro-test-key520400005303986',
          test_mode: true,
        },
      }
    case 'credit_card':
      return {
        success: true,
        message: 'Pagamento aprovado! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'paid',
          test_mode: true,
        },
      }
    case 'boleto':
      return {
        success: true,
        message: 'Boleto gerado! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          boleto_url: `https://sandbox.pagseguro.uol.com.br/boleto/${transactionId}`,
          test_mode: true,
        },
      }
    default:
      return {
        success: false,
        message: `Método não suportado: ${request.method}`,
      }
  }
}

export { mapStatus }
