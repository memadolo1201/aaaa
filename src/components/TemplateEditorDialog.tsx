import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Printer, Save } from "lucide-react";

interface Template {
  id: string;
  title: string;
  content: any;
}

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template;
  onTemplateSaved: () => void;
}

export const TemplateEditorDialog = ({
  open,
  onOpenChange,
  template,
  onTemplateSaved,
}: TemplateEditorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Load existing content or set default
      const existingContent = template.content?.text || "";
      setContent(existingContent);
    }
  }, [open, template]);

  const handleSave = async () => {
    setLoading(true);

    try {
      await updateDoc(doc(db, "templates", template.id), {
        content: { text: content },
        updated_at: new Date().toISOString(),
      });

      toast.success("تم حفظ القالب بنجاح");
      onTemplateSaved();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("فشل في حفظ القالب");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>${template.title}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              padding: 2cm;
              line-height: 1.6;
              direction: rtl;
            }
            h1 {
              text-align: center;
              margin-bottom: 2cm;
            }
            .content {
              white-space: pre-wrap;
              font-size: 12pt;
            }
            @media print {
              body {
                padding: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <h1>${template.title}</h1>
          <div class="content">${content}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تحرير القالب: {template.title}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="ml-2 h-4 w-4" />
                {loading ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>محتوى القالب</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-arabic"
              placeholder="اكتب محتوى القالب هنا..."
              dir="rtl"
            />
          </div>

          <div 
            ref={printRef}
            className="hidden"
          >
            <h1 className="text-center text-2xl font-bold mb-8">{template.title}</h1>
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
