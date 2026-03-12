'use server'
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AdminActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// --- PETS ---
export async function deletePetAsAdmin(petId: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  
  // Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('pets').delete().eq('id', petId);

  if (error) {
    console.error('Admin delete pet error:', error);
    return { success: false, error: 'Failed to delete pet' };
  }

  revalidatePath('/admin');
  revalidatePath('/lost-pets');
  return { success: true, message: 'İlan başarıyla silindi.' };
}

// --- NEWS ---
export async function deleteNews(id: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('news').delete().eq('id', id);

  if (error) {
    console.error('Admin delete news error:', error);
    return { success: false, error: 'Haber silinemedi.' };
  }

  revalidatePath('/admin');
  revalidatePath('/news');
  return { success: true, message: 'Haber başarıyla silindi.' };
}

// --- FORUM POSTS ---
export async function deleteForumPost(id: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('forum_posts').delete().eq('id', id);

  if (error) {
    console.error('Admin delete forum post error:', error);
    return { success: false, error: 'Konu silinemedi.' };
  }

  revalidatePath('/admin');
  revalidatePath('/forum');
  return { success: true, message: 'Konu başarıyla silindi.' };
}

// --- FORUM COMMENTS ---
export async function deleteComment(id: string): Promise<AdminActionResponse> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('comments').delete().eq('id', id);

  if (error) {
    console.error('Admin delete comment error:', error);
    return { success: false, error: 'Yorum silinemedi.' };
  }

  revalidatePath('/forum');
  return { success: true, message: 'Yorum başarıyla silindi.' };
}
