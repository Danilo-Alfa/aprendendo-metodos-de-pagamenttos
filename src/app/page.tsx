import Link from 'next/link'

const paymentProviders = [
  {
    id: 'pagarme',
    name: 'Pagar.me',
    description: 'Gateway de pagamento brasileiro com suporte a cartões, boleto e Pix',
    status: 'active',
    color: 'bg-green-500',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Plataforma global de pagamentos online',
    status: 'coming-soon',
    color: 'bg-purple-500',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Solução de pagamentos do Mercado Livre',
    status: 'coming-soon',
    color: 'bg-blue-500',
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Teste de SDKs de Pagamento
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Plataforma para testar e validar integrações com diferentes gateways de pagamento.
          Comece com Pagar.me e expanda para outros provedores.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          Provedores de Pagamento
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {paymentProviders.map((provider) => (
            <div key={provider.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${provider.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">
                    {provider.name.charAt(0)}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  provider.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {provider.status === 'active' ? 'Ativo' : 'Em breve'}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {provider.name}
              </h4>
              <p className="text-gray-600 mb-4">
                {provider.description}
              </p>
              {provider.status === 'active' ? (
                <Link
                  href={`/checkout?provider=${provider.id}`}
                  className="btn-primary inline-block text-center w-full"
                >
                  Testar Pagamento
                </Link>
              ) : (
                <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                  Em breve
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Funcionalidades Disponíveis
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Cartão de Crédito</h4>
              <p className="text-sm text-gray-600">Pagamentos com cartão de crédito e débito</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Boleto Bancário</h4>
              <p className="text-sm text-gray-600">Geração de boletos para pagamento</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Pix</h4>
              <p className="text-sm text-gray-600">Pagamentos instantâneos via Pix</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Histórico de Transações</h4>
              <p className="text-sm text-gray-600">Visualização de todas as transações realizadas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
