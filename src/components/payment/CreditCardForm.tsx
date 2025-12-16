'use client'

import { useState } from 'react'

interface CreditCardFormProps {
  onSubmit: (data: Record<string, unknown>) => void
  isProcessing: boolean
}

export default function CreditCardForm({ onSubmit, isProcessing }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [installments, setInstallments] = useState('1')

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const groups = numbers.match(/.{1,4}/g)
    return groups ? groups.join(' ').substr(0, 19) : ''
  }

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.substr(0, 2) + '/' + numbers.substr(2, 2)
    }
    return numbers
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      card: {
        number: cardNumber.replace(/\s/g, ''),
        holder_name: cardHolder,
        exp_month: expiryDate.split('/')[0],
        exp_year: '20' + expiryDate.split('/')[1],
        cvv,
      },
      installments: parseInt(installments),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número do Cartão
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          className="input-field"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome no Cartão
        </label>
        <input
          type="text"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
          className="input-field"
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Validade
          </label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            className="input-field"
            placeholder="MM/AA"
            maxLength={5}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substr(0, 4))}
            className="input-field"
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parcelas
        </label>
        <select
          value={installments}
          onChange={(e) => setInstallments(e.target.value)}
          className="input-field"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <option key={n} value={n}>
              {n}x {n === 1 ? 'à vista' : 'sem juros'}
            </option>
          ))}
        </select>
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
            Processando...
          </span>
        ) : (
          'Pagar com Cartão'
        )}
      </button>
    </form>
  )
}
