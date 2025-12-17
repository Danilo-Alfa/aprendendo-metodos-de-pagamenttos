import Link from 'next/link'

const paymentProviders = [
  {
    id: 'abacatepay',
    name: 'AbacatePay',
    description: 'Gateway brasileiro com taxa fixa de R$0,80. Suporta Pix e Cartão.',
    status: 'active',
    color: 'bg-green-500',
  },
  {
    id: 'pagarme',
    name: 'Pagar.me',
    description: 'Gateway de pagamento brasileiro com suporte a cartões, boleto e Pix',
    status: 'active',
    color: 'bg-emerald-600',
  },
  {
    id: 'pagseguro',
    name: 'PagSeguro',
    description: 'Gateway brasileiro do PagBank. Suporta Pix, Boleto e Cartão.',
    status: 'active',
    color: 'bg-yellow-500',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Plataforma global de pagamentos online',
    status: 'coming-soon',
    color: 'bg-purple-500',
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
          Comece com AbacatePay e expanda para outros provedores.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          Provedores de Pagamento
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          Funcionalidades por Provedor
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Funcionalidade</th>
                <th className="text-center py-2 px-3">AbacatePay</th>
                <th className="text-center py-2 px-3">Pagar.me</th>
                <th className="text-center py-2 px-3">PagSeguro</th>
                <th className="text-center py-2 px-3">Stripe</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">Pix</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-gray-400">-</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Cartão de Crédito</td>
                <td className="text-center py-2 px-3 text-yellow-600">Beta</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-yellow-600">SDK</td>
                <td className="text-center py-2 px-3 text-gray-400">-</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Boleto</td>
                <td className="text-center py-2 px-3 text-gray-400">-</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-gray-400">-</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Taxa</td>
                <td className="text-center py-2 px-3 font-medium">R$0,80/tx</td>
                <td className="text-center py-2 px-3 font-medium">1.19%+</td>
                <td className="text-center py-2 px-3 font-medium">1.19%+</td>
                <td className="text-center py-2 px-3 text-gray-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
