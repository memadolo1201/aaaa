import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
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
import { FileText } from 'lucide-react';

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedClientId?: string;
}

export function AddDocumentDialog({ open, onOpenChange, preSelectedClientId }: AddDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>(['']);

  const handleOpenGoogleDocs = () => {
    const newDocUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(title || 'مستند جديد')}`;
    window.open(newDocUrl, '_blank');
    toast.success('تم فتح مستند Google Docs. قم بنسخ الرابط ولصقه في حقل الرابط أدناه');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      const validUrls = fileUrls.filter(url => url.trim() !== '');
      
      await addDoc(collection(db, 'documents'), {
        title,
        type: '',
        category: '',
        file_urls: validUrls,
        client_id: preSelectedClientId || null,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success('تم إضافة المستند بنجاح');
      onOpenChange(false);
      setTitle('');
      setFileUrls(['']);
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('فشل في إضافة المستند');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة مستند جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">عنوان المستند</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
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
