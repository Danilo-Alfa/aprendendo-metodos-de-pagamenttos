import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET || ''
const ABACATEPAY_PUBLIC_KEY = process.env.ABACATEPAY_PUBLIC_KEY || ''

// Tipos dos eventos do AbacatePay
interface WebhookEvent {
  id: string
  devMode: boolean
  event: 'billing.paid' | 'withdraw.done' | 'withdraw.failed'
  data: BillingPaidData | WithdrawData
}

interface BillingPaidData {
  amount: number
  fee: number
  method: 'PIX' | 'CARD'
  billing?: {
    id: string
    products: Array<{
      id: string
      externalId: string
      quantity: number
    }>
    customer?: {
      id: string
      metadata: {
        name: string
        email: string
        cellphone: string
        taxId: string
      }
    }
  }
  pixQrCode?: {
    id: string
    amount: number
    status: string
  }
}

interface WithdrawData {
  id: string
  status: 'COMPLETE' | 'CANCELLED'
  amount: number
  platformFee: number
  receiptUrl?: string
}

// Validar assinatura HMAC-SHA256
function validateSignature(rawBody: string, signature: string): boolean {
  if (!ABACATEPAY_PUBLIC_KEY || !signature) {
    console.warn('⚠️ Validação HMAC ignorada - chave pública não configurada')
    return true // Permite em dev sem chave configurada
  }

  try {
    const expectedSig = crypto
      .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
      .update(rawBody)
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    )
  } catch {
    return false
  }
}

// Handler principal do webhook
export async function POST(request: NextRequest) {
  try {
    // 1. Validar secret via query parameter
    const { searchParams } = new URL(request.url)
    const webhookSecret = searchParams.get('webhookSecret')

    if (WEBHOOK_SECRET && webhookSecret !== WEBHOOK_SECRET) {
      console.error('❌ Webhook secret inválido')
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // 2. Ler body raw para validação HMAC
    const rawBody = await request.text()
    const signature = request.headers.get('X-Webhook-Signature') || ''

    // 3. Validar assinatura HMAC-SHA256
    if (!validateSignature(rawBody, signature)) {
      console.error('❌ Assinatura HMAC inválida')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 4. Parsear evento
    const event: WebhookEvent = JSON.parse(rawBody)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📥 Webhook recebido: ${event.event}`)
    console.log(`   ID: ${event.id}`)
    console.log(`   Dev Mode: ${event.devMode}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 5. Processar evento baseado no tipo
    switch (event.event) {
      case 'billing.paid':
        await handleBillingPaid(event.id, event.data as BillingPaidData)
        break

      case 'withdraw.done':
        await handleWithdrawDone(event.id, event.data as WithdrawData)
        break

      case 'withdraw.failed':
        await handleWithdrawFailed(event.id, event.data as WithdrawData)
        break

      default:
        console.log(`⚠️ Evento desconhecido: ${event.event}`)
    }

    // 6. Retornar sucesso (importante para o AbacatePay)
    return NextResponse.json({ received: true, eventId: event.id })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handlers de eventos
async function handleBillingPaid(eventId: string, data: BillingPaidData) {
  console.log('💰 PAGAMENTO CONFIRMADO!')
  console.log(`   Valor: R$ ${(data.amount / 100).toFixed(2)}`)
  console.log(`   Taxa: R$ ${(data.fee / 100).toFixed(2)}`)
  console.log(`   Método: ${data.method}`)

  if (data.billing) {
    console.log(`   Billing ID: ${data.billing.id}`)
    if (data.billing.customer) {
      console.log(`   Cliente: ${data.billing.customer.metadata.name}`)
      console.log(`   Email: ${data.billing.customer.metadata.email}`)
    }
  }

  if (data.pixQrCode) {
    console.log(`   PIX QRCode ID: ${data.pixQrCode.id}`)
  }

  // TODO: Atualizar banco de dados, enviar email, etc.
  // Exemplo: await db.transactions.update({ eventId, status: 'paid', ...data })
}

async function handleWithdrawDone(eventId: string, data: WithdrawData) {
  console.log('✅ SAQUE CONCLUÍDO!')
  console.log(`   ID: ${data.id}`)
  console.log(`   Valor: R$ ${(data.amount / 100).toFixed(2)}`)
  console.log(`   Taxa: R$ ${(data.platformFee / 100).toFixed(2)}`)
  if (data.receiptUrl) {
    console.log(`   Comprovante: ${data.receiptUrl}`)
  }
}

async function handleWithdrawFailed(eventId: string, data: WithdrawData) {
  console.log('❌ SAQUE FALHOU!')
  console.log(`   ID: ${data.id}`)
  console.log(`   Status: ${data.status}`)
}

// Responder a requisições GET (para teste)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AbacatePay webhook endpoint ativo',
    events: ['billing.paid', 'withdraw.done', 'withdraw.failed'],
  })
}
