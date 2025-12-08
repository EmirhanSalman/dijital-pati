'use server'

import { createClient, isAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Haber silme (Sadece admin)
 * @param id - Haber ID'si
 * @returns Başarı durumu
 */
export async function deleteNews(id: string) {
  try {
    // Admin kontrolü
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return {
        error: 'Bu işlem için admin yetkisi gereklidir.',
      }
    }

    const supabase = await createClient()

    // Haberi sil (veya is_active = false yap)
    const { error } = await supabase
      .from('news')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/')
    revalidatePath('/news')
    revalidatePath('/admin/news')

    return {
      success: true,
      message: 'Haber başarıyla silindi.',
    }
  } catch (error: any) {
    console.error('deleteNews error:', error)
    return {
      error: error.message || 'Haber silinirken bir hata oluştu.',
    }
  }
}

/**
 * Forum gönderisini silme (Sadece admin)
 * @param id - Forum gönderisi ID'si
 * @returns Başarı durumu
 */
export async function deleteForumPost(id: string) {
  try {
    // Admin kontrolü
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return {
        error: 'Bu işlem için admin yetkisi gereklidir.',
      }
    }

    const supabase = await createClient()

    // Forum gönderisini sil
    // Önce oyları sil (cascade ile otomatik silinir ama emin olmak için)
    await supabase.from('forum_votes').delete().eq('post_id', id)

    // Sonra gönderiyi sil
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/forum')
    revalidatePath('/forum/*')

    return {
      success: true,
      message: 'Forum gönderisi başarıyla silindi.',
    }
  } catch (error: any) {
    console.error('deleteForumPost error:', error)
    return {
      error: error.message || 'Forum gönderisi silinirken bir hata oluştu.',
    }
  }
}

/**
 * Forum yorumunu silme (Sadece admin)
 * @param id - Yorum ID'si
 * @returns Başarı durumu
 */
export async function deleteComment(id: string) {
  try {
    // Admin kontrolü
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return {
        error: 'Bu işlem için admin yetkisi gereklidir.',
      }
    }

    const supabase = await createClient()

    // Yorumu sil
    const { error } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/forum/*')

    return {
      success: true,
      message: 'Yorum başarıyla silindi.',
    }
  } catch (error: any) {
    console.error('deleteComment error:', error)
    return {
      error: error.message || 'Yorum silinirken bir hata oluştu.',
    }
  }
}
