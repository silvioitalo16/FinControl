import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Category, CategoryInsert, CategoryType } from '@/app/types'

export const categoriesService = {
  async getCategories(type?: CategoryType): Promise<Category[]> {
    const userId = getAuthUserId()

    let query = supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('is_default', { ascending: false })
      .order('name')

    if (type && type !== 'both') {
      query = query.in('type', [type, 'both'])
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async createCategory(input: Omit<CategoryInsert, 'user_id'>): Promise<Category> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...input, user_id: userId, is_default: false })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateCategory(id: string, input: Partial<Omit<CategoryInsert, 'user_id' | 'is_default'>>): Promise<Category> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('categories')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_default', false)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteCategory(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_default', false)
    if (error) throw error
  },
}
