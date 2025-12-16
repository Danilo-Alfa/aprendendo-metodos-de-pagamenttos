import { Transaction } from '@/types/payment'

// In-memory storage for development/testing
// In production, this would use a database
let transactions: Transaction[] = []

export async function saveTransaction(transaction: Transaction): Promise<void> {
  // Check if transaction already exists
  const existingIndex = transactions.findIndex((t) => t.id === transaction.id)

  if (existingIndex >= 0) {
    transactions[existingIndex] = {
      ...transactions[existingIndex],
      ...transaction,
      updated_at: new Date().toISOString(),
    }
  } else {
    transactions.push(transaction)
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  // Return transactions sorted by creation date (newest first)
  return [...transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return transactions.find((t) => t.id === id) || null
}

export async function updateTransactionStatus(
  id: string,
  status: Transaction['status']
): Promise<boolean> {
  const transaction = transactions.find((t) => t.id === id)

  if (transaction) {
    transaction.status = status
    transaction.updated_at = new Date().toISOString()
    return true
  }

  return false
}

export async function clearTransactions(): Promise<void> {
  transactions = []
}
