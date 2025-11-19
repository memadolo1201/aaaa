import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { z } from 'zod';

const clientSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل'),
  national_id: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

export const AddClientDialog = ({ open, onOpenChange, onClientAdded }: AddClientDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    national_id: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      clientSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول أولاً',
          variant: 'destructive',
        });
        return;
      }

      await addDoc(collection(db, 'clients'), {
        ...formData,
        email: formData.email || null,
        national_id: formData.national_id || null,
        address: formData.address || null,
        notes: formData.notes || null,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast({
        title: 'تم إضافة العميل بنجاح',
        description: 'تم حفظ بيانات العميل',
      });

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        national_id: '',
        address: '',
        notes: '',
      });
      onClientAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'خطأ في إضافة العميل',
        description: error.message || 'حدث خطأ أثناء إضافة العميل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">إضافة عميل جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="أدخل الاسم الكامل"
              required
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@mail.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              required
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="national_id">رقم الهوية</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              placeholder="1xxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="أدخل العنوان"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة العميل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
