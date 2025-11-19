import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Save, Type, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    title: string;
    content: any;
  };
  onSave: () => void;
}

export const TemplateEditor = ({ open, onOpenChange, template, onSave }: TemplateEditorProps) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && template) {
      setContent(template.content?.html || '<div style="padding: 20px; font-family: Arial, sans-serif;"><h1>قالب جديد</h1><p>ابدأ بالكتابة هنا...</p></div>');
    }
  }, [open, template]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'templates', template.id), {
        content: {
          html: editorRef.current?.innerHTML || content,
          fields: []
        },
        updated_at: new Date().toISOString(),
      });

      toast.success('تم حفظ التغييرات بنجاح');
      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('فشل في حفظ التغييرات');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>${template.title}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                direction: rtl;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${editorRef.current?.innerHTML || content}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const insertText = (text: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
      }
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const insertTable = () => {
    const rows = prompt('عدد الصفوف:', '3');
    const cols = prompt('عدد الأعمدة:', '3');
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;"><tbody>';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</tbody></table>';
      document.execCommand('insertHTML', false, tableHTML);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const img = `<img src="${event.target.result}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
          document.execCommand('insertHTML', false, img);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{template.title}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Toolbar */}
          <div className="flex gap-2 p-2 bg-muted rounded-lg flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('bold')}
              title="غامق"
            >
              <strong>B</strong>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('italic')}
              title="مائل"
            >
              <em>I</em>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('underline')}
              title="تحته خط"
            >
              <u>U</u>
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('formatBlock', '<h1>')}
              title="عنوان كبير"
            >
              H1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('formatBlock', '<h2>')}
              title="عنوان متوسط"
            >
              H2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('formatBlock', '<h3>')}
              title="عنوان صغير"
            >
              H3
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('insertUnorderedList')}
              title="قائمة نقطية"
            >
              •
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('insertOrderedList')}
              title="قائمة مرقمة"
            >
              1.
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('justifyRight')}
              title="محاذاة لليمين"
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('justifyCenter')}
              title="توسيط"
            >
              ↔
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('justifyLeft')}
              title="محاذاة لليسار"
            >
              →
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('fontSize', '7')}
              title="كبير"
            >
              A+
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => formatText('fontSize', '3')}
              title="صغير"
            >
              A-
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={insertTable}
              title="إدراج جدول"
              className="gap-1"
            >
              <Type className="w-4 h-4" />
              جدول
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={insertImage}
              title="إدراج صورة"
              className="gap-1"
            >
              <ImageIcon className="w-4 h-4" />
              صورة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText('[اسم العميل]')}
              title="إدراج حقل"
              className="gap-1"
            >
              <Type className="w-4 h-4" />
              حقل
            </Button>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-full p-8 focus:outline-none bg-white text-foreground"
              style={{ direction: 'rtl' }}
              dangerouslySetInnerHTML={{ __html: content }}
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
