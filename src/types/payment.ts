export type PaymentMethod = 'credit_card' | 'boleto' | 'pix'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export type PaymentProvider = 'pagarme' | 'stripe' | 'mercadopago'

export interface Customer {
  name: string
  email?: string
  document: string
  document_type: 'cpf' | 'cnpj'
}

export interface CreditCard {
  number: string
  holder_name: string
  exp_month: string
  exp_year: string
  cvv: string
}

export interface PaymentRequest {
  provider: PaymentProvider
  method: PaymentMethod
  amount: number // in cents
  customer?: Customer
  card?: CreditCard
  installments?: number
  pix?: {
    expires_in?: number
  }
}

export interface Transaction {
  id: string
  provider: PaymentProvider
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  customer?: Customer
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface PaymentResponse {
  success: boolean
  message: string
  data?: {
    transaction_id?: string
    status?: PaymentStatus
    boleto_url?: string
    boleto_barcode?: string
    pix_qr_code?: string
    pix_code?: string
    [key: string]: unknown
  }
}
