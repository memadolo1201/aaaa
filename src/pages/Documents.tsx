import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, User, Phone, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddDocumentDialog } from '@/components/AddDocumentDialog';
import { EditDocumentDialog } from '@/components/EditDocumentDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  category: string;
  file_url?: string;
  file_urls?: string[];
  created_at: string;
  client_id?: string;
}

const Documents = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch documents
    const docsQuery = query(
      collection(db, 'documents'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching documents:', error);
      toast.error('فشل في تحميل المستندات');
      setLoading(false);
    });

    // Fetch clients
    const clientsQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid)
    );
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
      setClients(clientsData);
    }, (error) => {
      console.error('Error fetching clients:', error);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeClients();
    };
  }, [user]);

  const getClientById = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId);
  };

  const isGoogleDocsUrl = (url: string) => {
    return url.includes('docs.google.com') || url.includes('drive.google.com');
  };

  const getDocumentCountByClient = (clientId: string) => {
    return documents.filter(doc => doc.client_id === clientId).length;
  };

  const filteredDocuments = documents.filter(doc => {
    // Filter by selected client
    if (selectedClientId !== 'all' && doc.client_id !== selectedClientId) {
      return false;
    }
    
    // Filter by search query
    const search = searchQuery.toLowerCase();
    const client = getClientById(doc.client_id);
    
    return (
      doc.title.toLowerCase().includes(search) ||
      doc.category.toLowerCase().includes(search) ||
      doc.type.toLowerCase().includes(search) ||
      (client?.full_name && client.full_name.toLowerCase().includes(search)) ||
      (client?.phone && client.phone.includes(search))
    );
  });

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (document: Document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;

    try {
      await deleteDoc(doc(db, 'documents', selectedDocument.id));
      toast.success('تم حذف المستند بنجاح');
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('فشل في حذف المستند');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AddDocumentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {selectedDocument && (
        <>
          <EditDocumentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            documentData={selectedDocument}
            onDocumentUpdated={() => {}}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title="تأكيد حذف المستند"
            description={`هل أنت متأكد من حذف المستند "${selectedDocument.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          />
        </>
      )}
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('documents')}</h1>
            <p className="text-muted-foreground">{t('documentsManagement')}</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            {t('addDocument')}
          </Button>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('searchDocuments')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder={t('filter')} />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">
                <div className="flex items-center justify-between w-full">
                  <span>جميع العملاء</span>
                  <Badge variant="secondary" className="mr-2">{documents.length}</Badge>
                </div>
              </SelectItem>
              {clients.map((client) => {
                const docCount = getDocumentCountByClient(client.id);
                return (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{client.full_name}</span>
                      <Badge variant="secondary" className="mr-2">{docCount}</Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noData')}</p>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد مستندات</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة أول مستند
            </Button>
          </CardContent>
        </Card>
        ) : null
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const client = getClientById(doc.client_id);
            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{doc.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {client && (
                      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{client.phone}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإضافة:</span>
                      <span className="english-nums">
                        {(() => {
                          const date = new Date(doc.created_at);
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
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {doc.file_urls && doc.file_urls.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-medium text-muted-foreground">الملفات المرفقة ({doc.file_urls.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {doc.file_urls.map((url, index) => {
                            const isGoogleDoc = isGoogleDocsUrl(url);
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                                className={`gap-2 ${isGoogleDoc ? 'border-blue-500/50 hover:border-blue-500' : ''}`}
                              >
                                {isGoogleDoc ? (
                                  <>
                                    <FileSpreadsheet className="h-3 w-3 text-blue-500" />
                                    Google Docs
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-3 w-3" />
                                    ملف {index + 1}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Documents;
