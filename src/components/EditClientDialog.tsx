import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: any;
  onClientUpdated: () => void;
}

export const EditClientDialog = ({ open, onOpenChange, clientData, onClientUpdated }: EditClientDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    national_id: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (open && clientData) {
      setFormData({
        full_name: clientData.full_name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        national_id: clientData.national_id || '',
        address: clientData.address || '',
        notes: clientData.notes || '',
      });
    }
  }, [open, clientData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientRef = doc(db, 'clients', clientData.id);
      await updateDoc(clientRef, {
        ...formData,
        updated_at: new Date().toISOString(),
      });

      toast.success('تم تحديث بيانات العميل بنجاح');
      onClientUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('خطأ في تحديث بيانات العميل');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل بيانات العميل</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_id">رقم الهوية</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
