import * as XLSX from 'xlsx';

export const exportToExcel = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string
) => {
  // Prepare data with selected columns only
  const exportData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      let value = item[col.dataKey] || '-';
      
      // Format dates to English numbers
      if (['filed_date', 'next_hearing_date', 'created_at', 'issue_date', 'due_date', 'event_date'].includes(col.dataKey)) {
        if (value && value !== '-') {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear());
          value = `${day}/${month}/${year}`;
        }
      }
      
      row[col.header] = value;
    });
    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Field definitions for different data types
export const clientFields = [
  { key: 'full_name', label: 'الاسم الكامل', default: true },
  { key: 'phone', label: 'رقم الهاتف', default: true },
  { key: 'email', label: 'البريد الإلكتروني', default: true },
  { key: 'national_id', label: 'رقم الهوية', default: false },
  { key: 'address', label: 'العنوان', default: false },
  { key: 'notes', label: 'ملاحظات', default: false },
];

export const caseFields = [
  { key: 'case_number', label: 'رقم القضية', default: true },
  { key: 'title', label: 'عنوان القضية', default: true },
  { key: 'case_type', label: 'نوع القضية', default: true },
  { key: 'status', label: 'الحالة', default: true },
  { key: 'priority', label: 'الأولوية', default: false },
  { key: 'court_name', label: 'اسم المحكمة', default: false },
  { key: 'filed_date', label: 'تاريخ الرفع', default: true },
  { key: 'next_hearing_date', label: 'موعد الجلسة القادمة', default: false },
  { key: 'description', label: 'الوصف', default: false },
];

export const invoiceFields = [
  { key: 'invoice_number', label: 'رقم الفاتورة', default: true },
  { key: 'client_name', label: 'اسم العميل', default: true },
  { key: 'amount', label: 'المبلغ', default: true },
  { key: 'status', label: 'الحالة', default: true },
  { key: 'issue_date', label: 'تاريخ الإصدار', default: true },
  { key: 'due_date', label: 'تاريخ الاستحقاق', default: true },
];
