import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Client {
  id: string;
  full_name: string;
}

export function AddInvoiceDialog({ open, onOpenChange }: AddInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    status: '',
    issue_date: '',
    due_date: '',
    client_id: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'clients'),
          where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          full_name: doc.data().full_name
        }));
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('فشل في تحميل العملاء');
      }
    };

    const generateInvoiceNumber = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, 'invoices'),
          where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const invoiceCount = querySnapshot.size;
        const newInvoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;
        setFormData(prev => ({ ...prev, invoice_number: newInvoiceNumber }));
      } catch (error) {
        console.error('Error generating invoice number:', error);
      }
    };

    if (open) {
      fetchClients();
      generateInvoiceNumber();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('يرجى اختيار العميل');
      return;
    }
    
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      await addDoc(collection(db, 'invoices'), {
        invoice_number: formData.invoice_number,
        amount: parseFloat(formData.amount),
        status: formData.status,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        client_id: formData.client_id,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success('تم إضافة الفاتورة بنجاح');
      onOpenChange(false);
      setFormData({ 
        invoice_number: '', 
        amount: '', 
        status: '', 
        issue_date: '', 
        due_date: '',
        client_id: ''
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast.error('فشل في إضافة الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة فاتورة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client_id">العميل</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="invoice_number">رقم الفاتورة</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">المبلغ (د.م)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">الحالة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="معلقة">معلقة</SelectItem>
                  <SelectItem value="مدفوعة">مدفوعة</SelectItem>
                  <SelectItem value="متأخرة">متأخرة</SelectItem>
                  <SelectItem value="ملغاة">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issue_date">تاريخ الإصدار</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
