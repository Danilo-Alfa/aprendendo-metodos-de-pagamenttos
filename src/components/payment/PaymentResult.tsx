'use client'

import { useState } from 'react'

interface PaymentResultProps {
  result: {
    success: boolean
    message: string
    data?: Record<string, unknown>
  }
  onReset: () => void
}

export default function PaymentResult({ result, onReset }: PaymentResultProps) {
  const [transactionId, setTransactionId] = useState(
    (result.data?.transaction_id as string) || ''
  )
  const [simulating, setSimulating] = useState(false)
  const [simulateResult, setSimulateResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSimulate = async () => {
    if (!transactionId) return

    setSimulating(true)
    setSimulateResult(null)

    try {
      const response = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      })

      const data = await response.json()
      setSimulateResult({
        success: data.success,
        message: data.message,
      })
    } catch {
      setSimulateResult({
        success: false,
        message: 'Erro ao simular pagamento',
      })
    } finally {
      setSimulating(false)
    }
  }

  const isPending = result.data?.status === 'pending'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        {result.success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pagamento Processado!
            </h2>
            <p className="text-gray-600 mb-6">{result.message}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erro no Pagamento
            </h2>
            <p className="text-gray-600 mb-6">{result.message}</p>
          </>
        )}

        {result.data && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Detalhes da Transação</h3>
            <div className="space-y-2 text-sm">
              {Boolean(result.data.transaction_id) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID da Transação:</span>
                  <span className="font-mono">{String(result.data.transaction_id)}</span>
                </div>
              )}
              {Boolean(result.data.status) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="capitalize">{String(result.data.status)}</span>
                </div>
              )}
              {Boolean(result.data.boleto_url) && (
                <div className="mt-4">
                  <a
                    href={String(result.data.boleto_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-block"
                  >
                    Visualizar Boleto
                  </a>
                </div>
              )}
              {Boolean(result.data.payment_url) && (
                <div className="mt-4 text-center">
                  <p className="text-gray-600 mb-3">
                    Clique no botão abaixo para finalizar o pagamento:
                  </p>
                  <a
                    href={String(result.data.payment_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pagar com Cartão
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    Você será redirecionado para o checkout seguro
                  </p>
                </div>
              )}
              {Boolean(result.data.pix_qr_code) && (
                <div className="mt-4 text-center">
                  <p className="text-gray-600 mb-2">QR Code Pix:</p>
                  <div className="bg-white p-4 rounded-lg inline-block border">
                    <img
                      src={`data:image/png;base64,${result.data.pix_qr_code}`}
                      alt="QR Code Pix"
                      className="w-48 h-48"
                    />
                  </div>
                  {Boolean(result.data.pix_code) && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm mb-2">Código Pix Copia e Cola:</p>
                      <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                        {String(result.data.pix_code)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Simulador de Pagamento (Dev Mode) */}
              {isPending && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-3">
                    Simular Pagamento (Dev Mode)
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Transaction ID"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={handleSimulate}
                      disabled={simulating || !transactionId}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {simulating ? 'Simulando...' : 'Simular'}
                    </button>
                  </div>
                  {simulateResult && (
                    <div
                      className={`mt-3 p-2 rounded text-sm ${
                        simulateResult.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {simulateResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button onClick={onReset} className="btn-secondary">
            Novo Pagamento
          </button>
          <a href="/transactions" className="btn-primary">
            Ver Transações
          </a>
        </div>
      </div>
    </div>
  )
}
