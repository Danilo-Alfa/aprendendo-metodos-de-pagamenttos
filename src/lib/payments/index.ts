import { PaymentRequest, PaymentResponse } from '@/types/payment'
import { processPagarmePayment } from './pagarme'

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  switch (request.provider) {
    case 'pagarme':
      return processPagarmePayment(request)
    case 'stripe':
      return {
        success: false,
        message: 'Provedor Stripe ainda não implementado',
      }
    case 'mercadopago':
      return {
        success: false,
        message: 'Provedor Mercado Pago ainda não implementado',
      }
    default:
      return {
        success: false,
        message: `Provedor desconhecido: ${request.provider}`,
      }
  }
}
