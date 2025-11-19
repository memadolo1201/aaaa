import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';

const caseSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  case_number: z.string().min(1, 'رقم القضية مطلوب'),
  case_type: z.string().min(1, 'نوع القضية مطلوب'),
  client_id: z.string().min(1, 'يجب اختيار العميل'),
});

interface AddCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseAdded: () => void;
}

export const AddCaseDialog = ({ open, onOpenChange, onCaseAdded }: AddCaseDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState({
    title: '',
    case_number: '',
    case_type: '',
    client_id: '',
    status: 'active',
    priority: 'medium',
    description: '',
    court_name: '',
    filed_date: '',
    next_hearing_date: '',
  });

  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        const q = query(
          collection(db, 'clients'),
          where('user_id', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      
      const generateCaseNumber = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const q = query(
            collection(db, 'cases'),
            where('user_id', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const caseCount = querySnapshot.size;
          const newCaseNumber = `CASE-${String(caseCount + 1).padStart(4, '0')}`;
          setFormData(prev => ({ ...prev, case_number: newCaseNumber }));
        } catch (error) {
          console.error('Error generating case number:', error);
        }
      };
      
      fetchClients();
      generateCaseNumber();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      caseSchema.parse(formData);
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

      await addDoc(collection(db, 'cases'), {
        ...formData,
        description: formData.description || null,
        court_name: formData.court_name || null,
        filed_date: formData.filed_date || null,
        next_hearing_date: formData.next_hearing_date || null,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast({ title: 'تم إضافة القضية بنجاح', description: 'تم حفظ بيانات القضية' });

      setFormData({
        title: '',
        case_number: '',
        case_type: '',
        client_id: '',
        status: 'active',
        priority: 'medium',
        description: '',
        court_name: '',
        filed_date: '',
        next_hearing_date: '',
      });
      onCaseAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'خطأ في إضافة القضية', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">إضافة قضية جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان القضية *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_number">رقم القضية *</Label>
              <Input id="case_number" value={formData.case_number} onChange={(e) => setFormData({ ...formData, case_number: e.target.value })} required />
              {errors.case_number && <p className="text-sm text-destructive">{errors.case_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العميل *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_type">نوع القضية *</Label>
              <Input id="case_type" value={formData.case_type} onChange={(e) => setFormData({ ...formData, case_type: e.target.value })} required />
              {errors.case_type && <p className="text-sm text-destructive">{errors.case_type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_name">اسم المحكمة</Label>
            <Input id="court_name" value={formData.court_name} onChange={(e) => setFormData({ ...formData, court_name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filed_date">تاريخ الرفع</Label>
              <Input id="filed_date" type="date" value={formData.filed_date} onChange={(e) => setFormData({ ...formData, filed_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_hearing_date">الجلسة القادمة</Label>
              <Input id="next_hearing_date" type="date" value={formData.next_hearing_date} onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>إلغاء</Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent">
              {loading ? 'جاري الإضافة...' : 'إضافة القضية'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
