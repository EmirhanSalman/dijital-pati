'use server'

import { createForumPost, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string | null

  if (!title || !content) {
    return {
      error: 'Başlık ve içerik alanları zorunludur.',
    }
  }

  try {
    const post = await createForumPost({
      title: title.trim(),
      content: content.trim(),
      category: category || undefined,
    })

    if (post) {
      revalidatePath('/forum')
      return {
        success: true,
        message: 'Konu açıldı, 10 Puan kazandın! 🎉',
        slug: post.slug,
      }
    }

    return {
      error: 'Konu oluşturulurken bir hata oluştu.',
    }
  } catch (error: any) {
    console.error('createPost error:', error)
    return {
      error: error.message || 'Konu oluşturulurken bir hata oluştu.',
    }
  }
}

/**
 * Forum gönderisine oy verir
 * @param postId - Forum gönderisi ID'si
 * @param voteType - Oy tipi: 1 = like, -1 = dislike, 0 = oy kaldır
 * @returns Başarı durumu
 */
export async function votePost(postId: string, voteType: 1 | -1 | 0) {
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

    // Mevcut oyu kontrol et
    const { data: existingVote } = await supabase
      .from('forum_votes')
      .select('id, vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (voteType === 0) {
      // Oyu kaldır
      if (existingVote) {
        const { error: deleteError } = await supabase
          .from('forum_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          throw deleteError
        }
      }
    } else if (existingVote) {
      // Oy değiştir
      if (existingVote.vote_type === voteType) {
        // Aynı oyu tekrar vermiş, oyu kaldır
        const { error: deleteError } = await supabase
          .from('forum_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          throw deleteError
        }
      } else {
        // Farklı oy ver, güncelle
        const { error: updateError } = await supabase
          .from('forum_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id)

        if (updateError) {
          throw updateError
        }
      }
    } else {
      // Yeni oy ver
      const { error: insertError } = await supabase
        .from('forum_votes')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            vote_type: voteType,
          },
        ])

      if (insertError) {
        throw insertError
      }
    }

    revalidatePath('/forum')
    revalidatePath(`/forum/*`)

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('votePost error:', error)
    return {
      error: error.message || 'Oy verilirken bir hata oluştu.',
    }
  }
}

/**
 * Forum gönderisine yorum ekler
 * @param postId - Forum gönderisi ID'si
 * @param content - Yorum içeriği
 * @returns Başarı durumu
 */
export async function createComment(postId: string, content: string) {
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

    if (!content || !content.trim()) {
      return {
        error: 'Yorum içeriği boş olamaz.',
      }
    }

    // Yorumu ekle
    const { error: insertError } = await supabase
      .from('forum_comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        },
      ])

    if (insertError) {
      throw insertError
    }

    revalidatePath('/forum')
    revalidatePath(`/forum/*`)

    return {
      success: true,
      message: 'Yorum eklendi, 2 Puan kazandın! 🎉',
    }
  } catch (error: any) {
    console.error('createComment error:', error)
    return {
      error: error.message || 'Yorum eklenirken bir hata oluştu.',
    }
  }
}
