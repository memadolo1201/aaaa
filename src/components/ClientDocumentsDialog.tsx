import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddDocumentDialog } from '@/components/AddDocumentDialog';
import { EditDocumentDialog } from '@/components/EditDocumentDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  type: string;
  category: string;
  file_urls?: string[];
  created_at: string;
  client_id?: string;
}

interface ClientDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

const getCategoryBadgeColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'عقد': 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    'وثيقة': 'bg-green-500/20 text-green-700 dark:text-green-300',
    'مرافعة': 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    'قرار': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  };
  return colors[category] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
};

export function ClientDocumentsDialog({ open, onOpenChange, clientId, clientName }: ClientDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (!open || !clientId) return;

    const q = query(
      collection(db, 'documents'),
      where('client_id', '==', clientId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, [open, clientId]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isGoogleDocsUrl = (url: string) => {
    return url.includes('docs.google.com') || url.includes('drive.google.com');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ملفات العميل: {clientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة مستند جديد
            </Button>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : documents.length === 0 ? (
              <Card className="luxury-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد مستندات</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    لم يتم إضافة أي مستندات لهذا العميل بعد
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مستند
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((document) => (
                  <Card key={document.id} className="luxury-card hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {document.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-end text-sm text-muted-foreground">
                        <span>{formatDate(document.created_at)}</span>
                      </div>
                      {document.file_urls && document.file_urls.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">الملفات المرفقة ({document.file_urls.length}):</Label>
                          {document.file_urls.map((url, index) => {
                            const isGoogleDoc = isGoogleDocsUrl(url);
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                className={`w-full justify-start ${isGoogleDoc ? 'border-blue-500/50 hover:border-blue-500' : ''}`}
                                onClick={() => window.open(url, '_blank')}
                              >
                                {isGoogleDoc ? (
                                  <>
                                    <FileSpreadsheet className="ml-2 h-4 w-4 text-blue-500" />
                                    Google Docs - ملف {index + 1}
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                    ملف {index + 1}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEdit(document)}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteClick(document)}
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
        </DialogContent>
      </Dialog>

      <AddDocumentDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        preSelectedClientId={clientId}
      />

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
    </>
  );
}
