import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FileText } from 'lucide-react';

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentData: any;
  onDocumentUpdated: () => void;
}

export const EditDocumentDialog = ({ open, onOpenChange, documentData, onDocumentUpdated }: EditDocumentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>(['']);

  useEffect(() => {
    if (open && documentData) {
      setTitle(documentData.title || '');
      setFileUrls(documentData.file_urls?.length > 0 ? documentData.file_urls : ['']);
    }
  }, [open, documentData]);

  const handleOpenGoogleDocs = () => {
    const newDocUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(title || 'مستند جديد')}`;
    window.open(newDocUrl, '_blank');
    toast.success('تم فتح مستند Google Docs. قم بنسخ الرابط ولصقه في حقل الرابط أدناه');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validUrls = fileUrls.filter(url => url.trim() !== '');
      
      const docRef = doc(db, 'documents', documentData.id);
      await updateDoc(docRef, {
        title,
        file_urls: validUrls,
        updated_at: new Date().toISOString(),
      });

      toast.success('تم تحديث المستند بنجاح');
      onDocumentUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('خطأ في تحديث المستند');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل المستند</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المستند *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>روابط الملفات (اختياري)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenGoogleDocs}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                إنشاء في Google Docs
              </Button>
            </div>
            {fileUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="أدخل رابط الملف"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...fileUrls];
                    newUrls[index] = e.target.value;
                    setFileUrls(newUrls);
                  }}
                />
                {fileUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newUrls = fileUrls.filter((_, i) => i !== index);
                      setFileUrls(newUrls);
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFileUrls([...fileUrls, ''])}
              className="w-full"
            >
              + إضافة رابط آخر
            </Button>
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
