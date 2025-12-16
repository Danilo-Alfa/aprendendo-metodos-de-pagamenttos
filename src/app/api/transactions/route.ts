import { NextResponse } from 'next/server'
import { getTransactions } from '@/lib/storage'

export async function GET() {
  try {
    const transactions = await getTransactions()
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}
