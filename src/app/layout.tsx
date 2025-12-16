import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SDK Pagamentos - Teste',
  description: 'Sistema de teste para SDKs de pagamento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  SDK Pagamentos Test
                </h1>
                <nav className="flex gap-4">
                  <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Home
                  </a>
                  <a href="/checkout" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Checkout
                  </a>
                  <a href="/transactions" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Transações
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
