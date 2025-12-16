import { PaymentRequest, PaymentResponse } from '@/types/payment'

// Mock Pagar.me integration for testing
// In production, this would use the actual Pagar.me SDK

const PAGARME_API_KEY = process.env.PAGARME_API_KEY || ''

function generateTransactionId(): string {
  return 'trx_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function generatePixCode(): string {
  // Generate a mock Pix EMV code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = '00020126580014br.gov.bcb.pix0136'
  for (let i = 0; i < 36; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code + '520400005303986'
}

function generateQRCodeBase64(): string {
  // Return a placeholder QR code (in production, generate actual QR code)
  // This is a simple 1x1 pixel placeholder
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

export async function processPagarmePayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Check for API key in production mode
  if (process.env.NODE_ENV === 'production' && !PAGARME_API_KEY) {
    return {
      success: false,
      message: 'Chave de API do Pagar.me não configurada',
    }
  }

  const transactionId = generateTransactionId()

  switch (request.method) {
    case 'credit_card':
      return processCreditCard(request, transactionId)
    case 'boleto':
      return processBoleto(request, transactionId)
    case 'pix':
      return processPix(request, transactionId)
    default:
      return {
        success: false,
        message: `Método de pagamento não suportado: ${request.method}`,
      }
  }
}

async function processCreditCard(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  if (!request.card) {
    return {
      success: false,
      message: 'Dados do cartão não fornecidos',
    }
  }

  // Validate card number (basic validation)
  const cardNumber = request.card.number.replace(/\D/g, '')
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return {
      success: false,
      message: 'Número do cartão inválido',
    }
  }

  // Simulate card processing
  // In test mode, cards starting with 4 are approved, others fail
  const isApproved = cardNumber.startsWith('4') || process.env.NODE_ENV !== 'production'

  if (isApproved) {
    return {
      success: true,
      message: 'Pagamento aprovado com sucesso!',
      data: {
        transaction_id: transactionId,
        status: 'paid',
        amount: request.amount,
        installments: request.installments || 1,
        card_last_digits: cardNumber.slice(-4),
        card_brand: getCardBrand(cardNumber),
      },
    }
  }

  return {
    success: false,
    message: 'Pagamento recusado pela operadora do cartão',
    data: {
      transaction_id: transactionId,
      status: 'failed',
    },
  }
}

async function processBoleto(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  if (!request.customer) {
    return {
      success: false,
      message: 'Dados do cliente não fornecidos',
    }
  }

  const boletoBarcode = generateBoletoBarcode()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)

  return {
    success: true,
    message: 'Boleto gerado com sucesso!',
    data: {
      transaction_id: transactionId,
      status: 'pending',
      amount: request.amount,
      boleto_url: `https://sandbox.pagar.me/boleto/${transactionId}`,
      boleto_barcode: boletoBarcode,
      due_date: dueDate.toISOString(),
    },
  }
}

async function processPix(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  if (!request.customer) {
    return {
      success: false,
      message: 'Dados do cliente não fornecidos',
    }
  }

  const pixCode = generatePixCode()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  return {
    success: true,
    message: 'QR Code Pix gerado com sucesso!',
    data: {
      transaction_id: transactionId,
      status: 'pending',
      amount: request.amount,
      pix_qr_code: generateQRCodeBase64(),
      pix_code: pixCode,
      expires_at: expiresAt.toISOString(),
    },
  }
}

function getCardBrand(cardNumber: string): string {
  if (cardNumber.startsWith('4')) return 'visa'
  if (cardNumber.startsWith('5')) return 'mastercard'
  if (cardNumber.startsWith('3')) return 'amex'
  if (cardNumber.startsWith('6')) return 'discover'
  return 'unknown'
}

function generateBoletoBarcode(): string {
  let barcode = ''
  for (let i = 0; i < 47; i++) {
    barcode += Math.floor(Math.random() * 10).toString()
  }
  return barcode
}
