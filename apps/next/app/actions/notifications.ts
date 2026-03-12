'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Bildirimi okundu olarak işaretler
 * @param notificationId - Bildirim ID'si
 * @returns Başarı durumu
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Bildirimi okundu olarak işaretle
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('markNotificationAsRead - Supabase error:', JSON.stringify(error, null, 2))
      throw error
    }

    // Güncelleme başarılı mı kontrol et
    if (!data || data.length === 0) {
      console.warn('markNotificationAsRead - No rows updated. Notification ID:', notificationId, 'User ID:', user.id)
      return {
        error: 'Bildirim bulunamadı veya güncellenemedi.',
      }
    }

    revalidatePath('/')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('markNotificationAsRead error:', error)
    return {
      error: error.message || 'Bildirim güncellenirken bir hata oluştu.',
    }
  }
}

/**
 * Tüm bildirimleri okundu olarak işaretler
 * @returns Başarı durumu
 */
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Tüm okunmamış bildirimleri okundu olarak işaretle
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select()

    if (error) {
      console.error('markAllNotificationsAsRead - Supabase error:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('markAllNotificationsAsRead - Updated notifications count:', data?.length || 0)

    revalidatePath('/')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('markAllNotificationsAsRead error:', error)
    return {
      error: error.message || 'Bildirimler güncellenirken bir hata oluştu.',
    }
  }
}

/**
 * Bildirimi siler
 * @param notificationId - Bildirim ID'si
 * @returns Başarı durumu
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Bildirimi sil
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteNotification - Supabase error:', JSON.stringify(error, null, 2))
      throw error
    }

    revalidatePath('/')
    revalidatePath('/notifications')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('deleteNotification error:', error)
    return {
      error: error.message || 'Bildirim silinirken bir hata oluştu.',
    }
  }
}

/**
 * Tüm bildirimleri siler
 * @returns Başarı durumu
 */
export async function deleteAllNotifications() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Tüm bildirimleri sil
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteAllNotifications - Supabase error:', JSON.stringify(error, null, 2))
      throw error
    }

    revalidatePath('/')
    revalidatePath('/notifications')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('deleteAllNotifications error:', error)
    return {
      error: error.message || 'Bildirimler silinirken bir hata oluştu.',
    }
  }
}

