'use client'

import { useState } from 'react'

interface PixFormProps {
  onSubmit: (data: Record<string, unknown>) => void
  isProcessing: boolean
}

export default function PixForm({ onSubmit, isProcessing }: PixFormProps) {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return numbers.substr(0, 3) + '.' + numbers.substr(3)
    if (numbers.length <= 9) return numbers.substr(0, 3) + '.' + numbers.substr(3, 3) + '.' + numbers.substr(6)
    return numbers.substr(0, 3) + '.' + numbers.substr(3, 3) + '.' + numbers.substr(6, 3) + '-' + numbers.substr(9, 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      customer: {
        name,
        document: cpf.replace(/\D/g, ''),
        document_type: 'cpf',
      },
      pix: {
        expires_in: 3600, // 1 hour
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-800">
          Pagamento instantâneo via Pix. O QR Code será gerado e ficará
          disponível por 1 hora.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome Completo
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CPF
        </label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className="input-field"
          placeholder="000.000.000-00"
          maxLength={14}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="btn-primary w-full py-3 text-lg"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Gerando Pix...
          </span>
        ) : (
          'Gerar QR Code Pix'
        )}
      </button>
    </form>
  )
}
