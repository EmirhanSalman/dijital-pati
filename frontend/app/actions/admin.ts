'use server'
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AdminActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function deletePetAsAdmin(petId: string): Promise<AdminActionResponse> {
  const supabase = await createClient();

  // RBAC Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId);

  if (error) {
    console.error('Admin delete error:', error);
    return { success: false, error: 'Failed to delete pet' };
  }

  revalidatePath('/admin');
  return { success: true, message: 'İlan başarıyla silindi.' };
}
