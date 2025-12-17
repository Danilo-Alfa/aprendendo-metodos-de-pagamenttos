import { NextRequest, NextResponse } from 'next/server'
import { simulatePixPayment } from '@/lib/payments/abacatepay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'transactionId é obrigatório' },
        { status: 400 }
      )
    }

    const result = await simulatePixPayment(transactionId)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    )
  }
}
