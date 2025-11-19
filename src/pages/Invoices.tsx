import { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Edit, Trash2, FileDown } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AddInvoiceDialog } from '@/components/AddInvoiceDialog';
import { EditInvoiceDialog } from '@/components/EditInvoiceDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { invoiceFields } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  client_id?: string;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
}

const Invoices = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch clients
    const fetchClients = async () => {
      try {
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
      }
    };

    fetchClients();

    // Fetch invoices
    const q = query(
      collection(db, 'invoices'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Invoice));
      setInvoices(invoicesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching invoices:', error);
      toast.error('فشل في تحميل الفواتير');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredInvoices = invoices.filter(invoice => {
    const search = searchQuery.toLowerCase();
    const clientName = clients.find(c => c.id === invoice.client_id)?.full_name.toLowerCase() || '';
    return (
      invoice.invoice_number.toLowerCase().includes(search) ||
      invoice.status.toLowerCase().includes(search) ||
      invoice.amount.toString().includes(search) ||
      clientName.includes(search)
    );
  });

  const getStatusText = (status: string) => {
    const statuses = {
      'paid': t('statusPaid'),
      'pending': t('statusPending'),
      'overdue': t('statusOverdue')
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try {
      await deleteDoc(doc(db, 'invoices', selectedInvoice.id));
      toast.success('تم حذف الفاتورة بنجاح');
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('فشل في حذف الفاتورة');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AddInvoiceDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {selectedInvoice && (
        <>
          <EditInvoiceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            invoiceData={selectedInvoice}
            onInvoiceUpdated={() => {}}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title="تأكيد حذف الفاتورة"
            description={`هل أنت متأكد من حذف الفاتورة "${selectedInvoice.invoice_number}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          />
        </>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={filteredInvoices.map(invoice => ({
          ...invoice,
          client_name: clients.find(c => c.id === invoice.client_id)?.full_name || '-'
        }))}
        fields={invoiceFields}
        title="تقرير الفواتير"
        filename={`invoices-${new Date().toISOString().split('T')[0]}`}
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('invoices')}</h1>
            <p className="text-muted-foreground">{t('invoicesManagement')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setExportDialogOpen(true)}
              variant="outline"
              disabled={invoices.length === 0}
            >
              <FileDown className="ml-2 h-4 w-4" />
              {t('export')}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              {t('addInvoice')}
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchInvoices')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد نتائج للبحث "{searchQuery}"</p>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد فواتير</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة أول فاتورة
            </Button>
          </CardContent>
        </Card>
        ) : null
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-1">{invoice.invoice_number}</span>
                  <Badge variant={getStatusVariant(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {invoice.client_id && (
                    <div className="flex justify-between pb-2 border-b">
                      <span className="text-muted-foreground">العميل:</span>
                      <span className="font-semibold">
                        {clients.find(c => c.id === invoice.client_id)?.full_name || 'غير محدد'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="text-lg font-bold">{invoice.amount.toLocaleString('ar-MA')} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ الإصدار:</span>
                    <span className="english-nums">
                      {(() => {
                        const date = new Date(invoice.issue_date);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = String(date.getFullYear());
                        return `${day}/${month}/${year}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                    <span className="english-nums">
                      {(() => {
                        const date = new Date(invoice.due_date);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = String(date.getFullYear());
                        return `${day}/${month}/${year}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(invoice)}
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(invoice)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invoices;
