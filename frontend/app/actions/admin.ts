'use server'

import { createClient, isAdmin, createNotification } from '@/lib/supabase/server'
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
 * Forum yorumunu silme (Admin veya yorum sahibi)
 * @param id - Yorum ID'si
 * @returns Başarı durumu
 */
export async function deleteComment(id: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Yorumu getir
    const { data: comment, error: fetchError } = await supabase
      .from('forum_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !comment) {
      return {
        error: 'Yorum bulunamadı.',
      }
    }

    // Yetki kontrolü: Admin veya yorum sahibi
    const adminCheck = await isAdmin()
    const isOwner = comment.user_id === user.id

    if (!adminCheck && !isOwner) {
      return {
        error: 'Bu işlem için yetkiniz yok. Sadece yorum sahibi veya admin bu işlemi yapabilir.',
      }
    }

    // Yorumu sil
    const { error } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Moderasyon bildirimi: Eğer silen kişi Admin ise VE yorumun sahibi kendisi değilse -> Bildirim gönder
    if (adminCheck && comment.user_id !== user.id) {
      await createNotification({
        userId: comment.user_id, // Yorum sahibine
        type: "system", // İkon seçimi için system kullanıyoruz
        message: "Bir yorumunuz topluluk kurallarına uymadığı için yönetici tarafından kaldırıldı.",
        link: "/forum", // Kullanıcıyı genel forum sayfasına yönlendiriyoruz
        metadata: {
          comment_id: id,
          deleted_by: user.id,
          action: "comment_deleted_by_admin",
        },
      })
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
