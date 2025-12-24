'use client'
import { useState } from 'react';
import { deletePetAsAdmin } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function AdminDeleteButton({ petId }: { petId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?')) return;

    setIsDeleting(true);
    try {
      const result = await deletePetAsAdmin(petId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Silme başarısız');
      }
    } catch (error) {
      toast.error('Beklenmeyen hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      title="İlanı Sil"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

