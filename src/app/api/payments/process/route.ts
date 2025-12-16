import { NextRequest, NextResponse } from 'next/server'
import { PaymentRequest, PaymentResponse, Transaction } from '@/types/payment'
import { processPayment } from '@/lib/payments'
import { saveTransaction } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()

    // Validate required fields
    if (!body.provider || !body.method || !body.amount) {
      return NextResponse.json<PaymentResponse>(
        {
          success: false,
          message: 'Campos obrigatórios ausentes: provider, method, amount',
        },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json<PaymentResponse>(
        {
          success: false,
          message: 'O valor do pagamento deve ser maior que zero',
        },
        { status: 400 }
      )
    }

    // Process payment based on provider
    const result = await processPayment(body)

    // Save transaction if successful
    if (result.success && result.data?.transaction_id) {
      const transaction: Transaction = {
        id: result.data.transaction_id,
        provider: body.provider,
        method: body.method,
        amount: body.amount,
        status: result.data.status || 'pending',
        customer: body.customer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: result.data,
      }
      await saveTransaction(transaction)
    }

    return NextResponse.json<PaymentResponse>(result)
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json<PaymentResponse>(
      {
        success: false,
        message: 'Erro interno ao processar pagamento',
      },
      { status: 500 }
    )
  }
}
