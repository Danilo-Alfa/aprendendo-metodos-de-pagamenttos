import { PaymentRequest, PaymentResponse } from '@/types/payment'
import { processAbacatePayPayment } from './abacatepay'
import { processPagarmePayment } from './pagarme'
import { processPagSeguroPayment } from './pagseguro'

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  switch (request.provider) {
    case 'abacatepay':
      return processAbacatePayPayment(request)
    case 'pagarme':
      return processPagarmePayment(request)
    case 'pagseguro':
      return processPagSeguroPayment(request)
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
