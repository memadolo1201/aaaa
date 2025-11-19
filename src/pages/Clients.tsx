import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Phone, Mail, MapPin, Search, Edit, Trash2, FileDown, FileText } from 'lucide-react';
import { AddClientDialog } from '@/components/AddClientDialog';
import { EditClientDialog } from '@/components/EditClientDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { ClientDocumentsDialog } from '@/components/ClientDocumentsDialog';
import { clientFields } from '@/lib/exportUtils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  created_at: string;
}

const Clients = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Client[];
        setClients(clientsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching clients:', error);
        toast.error('فشل في تحميل العملاء');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.full_name.toLowerCase().includes(search) ||
      client.phone.includes(search) ||
      (client.email?.toLowerCase() || '').includes(search) ||
      ((client as any).national_id?.toLowerCase() || '').includes(search) ||
      (client.address?.toLowerCase() || '').includes(search)
    );
  });

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleViewDocuments = (client: Client) => {
    setSelectedClient(client);
    setDocumentsDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;

    try {
      await deleteDoc(doc(db, 'clients', selectedClient.id));
      toast.success('تم حذف العميل بنجاح');
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('فشل في حذف العميل');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AddClientDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onClientAdded={() => {}}
      />

      {selectedClient && (
        <>
          <EditClientDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            clientData={selectedClient}
            onClientUpdated={() => {}}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title="تأكيد حذف العميل"
            description={`هل أنت متأكد من حذف العميل "${selectedClient.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          />
          <ClientDocumentsDialog
            open={documentsDialogOpen}
            onOpenChange={setDocumentsDialogOpen}
            clientId={selectedClient.id}
            clientName={selectedClient.full_name}
          />
        </>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={filteredClients}
        fields={clientFields}
        title="تقرير العملاء"
        filename={`clients-${new Date().toISOString().split('T')[0]}`}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('clients')}</h1>
          <p className="text-muted-foreground mt-1">{t('clientsManagement')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            disabled={clients.length === 0}
          >
            <FileDown className="ml-2 h-4 w-4" />
            {t('export')}
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
          >
            <UserPlus className="ml-2 h-4 w-4" />
            {t('addClient')}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('searchClients')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="luxury-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm ? t('noData') : t('noData')}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'ابدأ بإضافة عميل جديد'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
              >
                <UserPlus className="ml-2 h-4 w-4" />
                {t('addClient')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="luxury-card hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-xl">{client.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewDocuments(client)}
                  >
                    <FileText className="h-4 w-4 ml-2" />
                    {t('documents')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    {t('edit')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteClick(client)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
