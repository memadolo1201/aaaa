import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: any;
  onCaseUpdated: () => void;
}

export const EditCaseDialog = ({ open, onOpenChange, caseData, onCaseUpdated }: EditCaseDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
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
    if (open && caseData) {
      setFormData({
        title: caseData.title || '',
        case_number: caseData.case_number || '',
        case_type: caseData.case_type || '',
        client_id: caseData.client_id || '',
        status: caseData.status || 'active',
        priority: caseData.priority || 'medium',
        description: caseData.description || '',
        court_name: caseData.court_name || '',
        filed_date: caseData.filed_date || '',
        next_hearing_date: caseData.next_hearing_date || '',
      });

      const fetchClients = async () => {
        const snapshot = await getDocs(collection(db, 'clients'));
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchClients();
    }
  }, [open, caseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const caseRef = doc(db, 'cases', caseData.id);
      await updateDoc(caseRef, {
        ...formData,
        updated_at: new Date().toISOString(),
      });

      toast({ title: 'تم تحديث القضية بنجاح' });
      onCaseUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'خطأ في تحديث القضية', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل القضية</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان القضية *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_number">رقم القضية *</Label>
              <Input
                id="case_number"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                required
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_type">نوع القضية *</Label>
              <Select value={formData.case_type} onValueChange={(value) => setFormData({ ...formData, case_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع القضية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="جنائية">جنائية</SelectItem>
                  <SelectItem value="مدنية">مدنية</SelectItem>
                  <SelectItem value="تجارية">تجارية</SelectItem>
                  <SelectItem value="عمالية">عمالية</SelectItem>
                  <SelectItem value="أسرية">أسرية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id">العميل *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="court_name">اسم المحكمة</Label>
              <Input
                id="court_name"
                value={formData.court_name}
                onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filed_date">تاريخ رفع القضية</Label>
              <Input
                id="filed_date"
                type="date"
                value={formData.filed_date}
                onChange={(e) => setFormData({ ...formData, filed_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="next_hearing_date">تاريخ الجلسة القادمة</Label>
              <Input
                id="next_hearing_date"
                type="date"
                value={formData.next_hearing_date}
                onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">وصف القضية</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
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
