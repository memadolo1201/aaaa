import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";
import { toast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  fields: { key: string; label: string; default: boolean }[];
  title: string;
  filename: string;
}

export const ExportDialog = ({
  open,
  onOpenChange,
  data,
  fields,
  title,
  filename,
}: ExportDialogProps) => {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    fields.filter(f => f.default).map(f => f.key)
  );

  const handleFieldToggle = (key: string) => {
    setSelectedFields(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handlePrint = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار حقل واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للطباعة",
        variant: "destructive",
      });
      return;
    }

    const columns = fields
      .filter(f => selectedFields.includes(f.key))
      .map(f => ({ header: f.label, dataKey: f.key }));

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = data.map(item => {
      const formattedItem = { ...item };
      // Format dates to English numbers
      ['filed_date', 'next_hearing_date', 'created_at', 'issue_date', 'due_date', 'event_date'].forEach(dateField => {
        if (formattedItem[dateField]) {
          const date = new Date(formattedItem[dateField]);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear());
          formattedItem[dateField] = `${day}/${month}/${year}`;
        }
      });
      
      return `
        <tr>
          ${columns.map(col => `<td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formattedItem[col.dataKey] || '-'}</td>`).join('')}
        </tr>
      `;
    }).join('');


    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            font-family: 'Cairo', sans-serif;
          }
          body {
            direction: rtl;
            padding: 20px;
          }
          h1 {
            color: #1e293b;
            margin-bottom: 10px;
          }
          .date {
            color: #64748b;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #6366f1;
            color: white;
            padding: 12px;
            text-align: right;
            border: 1px solid #ddd;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);

    onOpenChange(false);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار حقل واحد على الأقل للتصدير",
        variant: "destructive",
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const columns = fields
      .filter(f => selectedFields.includes(f.key))
      .map(f => ({ header: f.label, dataKey: f.key }));

    try {
      exportToExcel(data, columns, filename);

      toast({
        title: "نجح التصدير",
        description: `تم تصدير ${data.length} سجل بنجاح`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تصدير البيانات</DialogTitle>
          <DialogDescription>
            اختر الحقول التي تريد تصديرها ({data.length} سجل)
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.key} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={field.key}
                  checked={selectedFields.includes(field.key)}
                  onCheckedChange={() => handleFieldToggle(field.key)}
                />
                <Label
                  htmlFor={field.key}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير Excel
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
