import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Transaction, TransactionWithCategory, TransactionFilters } from '@/app/types'
import type { TransactionInput } from '@/app/validators/transaction.schema'
import { PAGINATION } from '@/app/config/constants'

export const transactionsService = {
  async getTransactions(filters: TransactionFilters = {}): Promise<{
    data: TransactionWithCategory[]
    count: number
  }> {
    const userId = getAuthUserId()
    const { type, category_id, dateFrom, dateTo, search, page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = filters
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('transactions')
      .select('*, categories(*)', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (type && type !== 'all')  query = query.eq('type', type)
    if (category_id)             query = query.eq('category_id', category_id)
    if (dateFrom)                query = query.gte('date', dateFrom)
    if (dateTo)                  query = query.lte('date', dateTo)
    if (search)                  query = query.ilike('description', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    return { data: (data ?? []) as TransactionWithCategory[], count: count ?? 0 }
  },

  async getMonthlySummary(month: string): Promise<{ income: number; expenses: number }> {
    const userId = getAuthUserId()
    const startDate = month  // ex: '2026-04-01'
    // Parseia diretamente da string para evitar bug de timezone (new Date('yyyy-MM-dd') = UTC midnight)
    const [yearStr, monStr] = month.split('-')
    const lastDay = new Date(parseInt(yearStr, 10), parseInt(monStr, 10), 0).getDate()
    const endDate = `${yearStr}-${monStr}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error

    const income   = data?.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) ?? 0
    const expenses = data?.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) ?? 0
    return { income, expenses }
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('transactions')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTransaction(id: string): Promise<void> {
    const userId = getAuthUserId()
    // Soft delete
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },
}
