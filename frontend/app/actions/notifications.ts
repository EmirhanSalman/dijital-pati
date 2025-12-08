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
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      throw error
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
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      throw error
    }

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

