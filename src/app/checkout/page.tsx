'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CreditCardForm from '@/components/payment/CreditCardForm'
import BoletoForm from '@/components/payment/BoletoForm'
import PixForm from '@/components/payment/PixForm'
import PaymentResult from '@/components/payment/PaymentResult'

type PaymentMethod = 'credit_card' | 'boleto' | 'pix'

interface PaymentResultData {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') || 'pagarme'

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')
  const [amount, setAmount] = useState<string>('100.00')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<PaymentResultData | null>(null)

  const handlePayment = async (paymentData: Record<string, unknown>) => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          method: paymentMethod,
          amount: parseFloat(amount) * 100, // Convert to cents
          ...paymentData,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch {
      setResult({
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPayment = () => {
    setResult(null)
  }

  if (result) {
    return <PaymentResult result={result} onReset={resetPayment} />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h2>
          <p className="text-gray-600">
            Provedor: <span className="font-medium capitalize">{provider}</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor do Pagamento (R$)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            min="0.01"
            step="0.01"
            placeholder="100.00"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de Pagamento
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'credit_card'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-medium">Cartão</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('boleto')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'boleto'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Boleto</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'pix'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-sm font-medium">Pix</span>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          {paymentMethod === 'credit_card' && (
            <CreditCardForm onSubmit={handlePayment} isProcessing={isProcessing} />
          )}
          {paymentMethod === 'boleto' && (
            <BoletoForm onSubmit={handlePayment} isProcessing={isProcessing} />
          )}
          {paymentMethod === 'pix' && (
            <PixForm onSubmit={handlePayment} isProcessing={isProcessing} />
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingCheckout() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingCheckout />}>
      <CheckoutContent />
    </Suspense>
  )
}
