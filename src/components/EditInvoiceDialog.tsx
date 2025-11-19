import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: any;
  onInvoiceUpdated: () => void;
}

interface Client {
  id: string;
  full_name: string;
}

export const EditInvoiceDialog = ({ open, onOpenChange, invoiceData, onInvoiceUpdated }: EditInvoiceDialogProps) => {
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
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          full_name: doc.data().full_name
        }));
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    if (open && invoiceData) {
      setFormData({
        invoice_number: invoiceData.invoice_number || '',
        amount: invoiceData.amount?.toString() || '',
        status: invoiceData.status || '',
        issue_date: invoiceData.issue_date || '',
        due_date: invoiceData.due_date || '',
        client_id: invoiceData.client_id || '',
      });
      fetchClients();
    }
  }, [open, invoiceData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('يرجى اختيار العميل');
      return;
    }
    
    setLoading(true);

    try {
      const invoiceRef = doc(db, 'invoices', invoiceData.id);
      await updateDoc(invoiceRef, {
        amount: parseFloat(formData.amount),
        status: formData.status,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        client_id: formData.client_id,
        updated_at: new Date().toISOString(),
      });

      toast.success('تم تحديث الفاتورة بنجاح');
      onInvoiceUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('خطأ في تحديث الفاتورة');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل الفاتورة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
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
                disabled
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
