import { PaymentRequest, PaymentResponse } from '@/types/payment'

const PAGARME_API_URL = 'https://api.pagar.me/core/v5'
const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || ''

interface PagarmeOrderRequest {
  items: Array<{
    amount: number
    description: string
    quantity: number
    code?: string
  }>
  customer: {
    name: string
    email: string
    type: 'individual' | 'company'
    document: string
    document_type?: 'CPF' | 'CNPJ'
    phones?: {
      mobile_phone?: {
        country_code: string
        area_code: string
        number: string
      }
    }
  }
  payments: Array<{
    payment_method: 'credit_card' | 'boleto' | 'pix'
    credit_card?: {
      installments: number
      statement_descriptor?: string
      card: {
        number: string
        holder_name: string
        exp_month: number
        exp_year: number
        cvv: string
        billing_address?: {
          line_1: string
          zip_code: string
          city: string
          state: string
          country: string
        }
      }
    }
    boleto?: {
      bank: string
      instructions: string
      due_at: string
      document_number?: string
    }
    pix?: {
      expires_in: number
    }
  }>
  closed?: boolean
}

interface PagarmeResponse {
  id: string
  code: string
  status: string
  charges?: Array<{
    id: string
    code: string
    status: string
    last_transaction?: {
      id: string
      status: string
      success: boolean
      qr_code?: string
      qr_code_url?: string
      pdf?: string
      line?: string
      expires_at?: string
    }
  }>
}

async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<{ success: boolean; data?: PagarmeResponse; error?: string }> {
  if (!PAGARME_SECRET_KEY) {
    return {
      success: false,
      error: 'PAGARME_SECRET_KEY não configurada. Configure no arquivo .env.local',
    }
  }

  const authHeader = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64')

  try {
    const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Pagar.me API Error:', data)
      return {
        success: false,
        error: data.message || `Erro na API: ${response.status}`,
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Pagar.me Request Error:', error)
    return {
      success: false,
      error: 'Erro de conexão com o Pagar.me',
    }
  }
}

export async function processPagarmePayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Verificar se está em modo de teste (sem chave configurada)
  if (!PAGARME_SECRET_KEY || PAGARME_SECRET_KEY === 'test_key') {
    return processTestPayment(request)
  }

  switch (request.method) {
    case 'credit_card':
      return processCreditCardPayment(request)
    case 'boleto':
      return processBoletoPayment(request)
    case 'pix':
      return processPixPayment(request)
    default:
      return {
        success: false,
        message: `Método de pagamento não suportado: ${request.method}`,
      }
  }
}

async function processCreditCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
  if (!request.card) {
    return { success: false, message: 'Dados do cartão não fornecidos' }
  }

  const orderRequest: PagarmeOrderRequest = {
    items: [
      {
        amount: request.amount,
        description: 'Pagamento de teste',
        quantity: 1,
        code: 'test-item',
      },
    ],
    customer: {
      name: request.card.holder_name,
      email: request.customer?.email || 'cliente@teste.com',
      type: 'individual',
      document: request.customer?.document || '00000000000',
      document_type: 'CPF',
    },
    payments: [
      {
        payment_method: 'credit_card',
        credit_card: {
          installments: request.installments || 1,
          statement_descriptor: 'PAGAMENTO TESTE',
          card: {
            number: request.card.number,
            holder_name: request.card.holder_name,
            exp_month: parseInt(request.card.exp_month),
            exp_year: parseInt(request.card.exp_year),
            cvv: request.card.cvv,
          },
        },
      },
    ],
    closed: true,
  }

  const result = await makeRequest('/orders', 'POST', orderRequest)

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Erro ao processar pagamento',
    }
  }

  const charge = result.data?.charges?.[0]
  const transaction = charge?.last_transaction

  return {
    success: transaction?.success || false,
    message: transaction?.success ? 'Pagamento aprovado!' : 'Pagamento recusado',
    data: {
      transaction_id: result.data?.id,
      status: mapStatus(result.data?.status || 'failed'),
      charge_id: charge?.id,
      provider_response: result.data,
    },
  }
}

async function processBoletoPayment(request: PaymentRequest): Promise<PaymentResponse> {
  if (!request.customer) {
    return { success: false, message: 'Dados do cliente não fornecidos' }
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)

  const orderRequest: PagarmeOrderRequest = {
    items: [
      {
        amount: request.amount,
        description: 'Pagamento de teste',
        quantity: 1,
        code: 'test-item',
      },
    ],
    customer: {
      name: request.customer.name,
      email: request.customer.email || 'cliente@teste.com',
      type: 'individual',
      document: request.customer.document,
      document_type: 'CPF',
    },
    payments: [
      {
        payment_method: 'boleto',
        boleto: {
          bank: '237', // Bradesco
          instructions: 'Pagar até a data de vencimento',
          due_at: dueDate.toISOString(),
        },
      },
    ],
    closed: true,
  }

  const result = await makeRequest('/orders', 'POST', orderRequest)

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Erro ao gerar boleto',
    }
  }

  const charge = result.data?.charges?.[0]
  const transaction = charge?.last_transaction

  return {
    success: true,
    message: 'Boleto gerado com sucesso!',
    data: {
      transaction_id: result.data?.id,
      status: 'pending',
      boleto_url: transaction?.pdf,
      boleto_barcode: transaction?.line,
      due_date: dueDate.toISOString(),
      provider_response: result.data,
    },
  }
}

async function processPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
  if (!request.customer) {
    return { success: false, message: 'Dados do cliente não fornecidos' }
  }

  const expiresIn = request.pix?.expires_in || 3600 // 1 hora por padrão

  const orderRequest: PagarmeOrderRequest = {
    items: [
      {
        amount: request.amount,
        description: 'Pagamento de teste',
        quantity: 1,
        code: 'test-item',
      },
    ],
    customer: {
      name: request.customer.name,
      email: request.customer.email || 'cliente@teste.com',
      type: 'individual',
      document: request.customer.document,
      document_type: 'CPF',
    },
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: expiresIn,
        },
      },
    ],
    closed: true,
  }

  const result = await makeRequest('/orders', 'POST', orderRequest)

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Erro ao gerar Pix',
    }
  }

  const charge = result.data?.charges?.[0]
  const transaction = charge?.last_transaction

  return {
    success: true,
    message: 'QR Code Pix gerado com sucesso!',
    data: {
      transaction_id: result.data?.id,
      status: 'pending',
      pix_qr_code: transaction?.qr_code_url ? await fetchQRCodeBase64(transaction.qr_code_url) : undefined,
      pix_code: transaction?.qr_code,
      expires_at: transaction?.expires_at,
      provider_response: result.data,
    },
  }
}

async function fetchQRCodeBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch {
    return undefined
  }
}

function mapStatus(pagarmeStatus: string): 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled' {
  const statusMap: Record<string, 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled'> = {
    pending: 'pending',
    processing: 'processing',
    paid: 'paid',
    failed: 'failed',
    canceled: 'cancelled',
    refunded: 'refunded',
  }
  return statusMap[pagarmeStatus] || 'pending'
}

// Função de teste para quando não há chave configurada
async function processTestPayment(request: PaymentRequest): Promise<PaymentResponse> {
  console.log('⚠️ Modo de teste ativo - configure PAGARME_SECRET_KEY para usar a API real')

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const transactionId = 'test_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

  switch (request.method) {
    case 'credit_card': {
      const cardNumber = request.card?.number.replace(/\D/g, '') || ''
      const isApproved = cardNumber.startsWith('4') // Cartões Visa são aprovados no teste

      return {
        success: isApproved,
        message: isApproved ? 'Pagamento aprovado! (MODO TESTE)' : 'Pagamento recusado (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: isApproved ? 'paid' : 'failed',
          test_mode: true,
        },
      }
    }
    case 'boleto':
      return {
        success: true,
        message: 'Boleto gerado com sucesso! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          boleto_url: `https://sandbox.pagar.me/boleto/${transactionId}`,
          boleto_barcode: '23793.38128 60000.000003 00000.000400 1 84340000001000',
          test_mode: true,
        },
      }
    case 'pix':
      return {
        success: true,
        message: 'QR Code Pix gerado! (MODO TESTE)',
        data: {
          transaction_id: transactionId,
          status: 'pending',
          pix_code: '00020126580014br.gov.bcb.pix0136teste-pix-key-here520400005303986',
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
