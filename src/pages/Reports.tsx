import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt,
  Calendar,
  DollarSign,
  PieChart,
  FileDown
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Reports = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [compareYear, setCompareYear] = useState("");
  const [enableComparison, setEnableComparison] = useState(false);
  
  // Refs for charts
  const casesChartRef = useRef<HTMLDivElement>(null);
  const clientsChartRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  const typeChartRef = useRef<HTMLDivElement>(null);
  
  // Data states
  const [casesData, setCasesData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalCases: 0,
    totalClients: 0,
    totalRevenue: 0,
    totalDocuments: 0,
    activeCases: 0,
    closedCases: 0
  });
  
  // Comparison data
  const [compareMonthlyStats, setCompareMonthlyStats] = useState({
    totalCases: 0,
    totalClients: 0,
    totalRevenue: 0,
    totalDocuments: 0,
    activeCases: 0,
    closedCases: 0
  });
  const [growthStats, setGrowthStats] = useState({
    casesGrowth: 0,
    clientsGrowth: 0,
    revenueGrowth: 0,
    documentsGrowth: 0
  });

  const COLORS = [
    'hsl(var(--accent))',
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  useEffect(() => {
    fetchReportsData();
  }, [period, year, compareYear, enableComparison]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [casesSnap, clientsSnap, invoicesSnap, documentsSnap] = await Promise.all([
        getDocs(collection(db, "cases")),
        getDocs(collection(db, "clients")),
        getDocs(collection(db, "invoices")),
        getDocs(collection(db, "documents"))
      ]);

      const allCases = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allClients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allInvoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate monthly statistics
      const currentYear = parseInt(year);
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      
      // Cases by month
      const casesMonthly = Array(12).fill(0).map((_, i) => ({
        month: monthNames[i],
        currentYear: 0,
        previousYear: 0
      }));

      allCases.forEach((case_: any) => {
        const date = case_.filed_date ? new Date(case_.filed_date) : case_.createdAt ? new Date(case_.createdAt) : null;
        if (date) {
          if (date.getFullYear() === currentYear) {
            casesMonthly[date.getMonth()].currentYear++;
          } else if (enableComparison && compareYear && date.getFullYear() === parseInt(compareYear)) {
            casesMonthly[date.getMonth()].previousYear++;
          }
        }
      });

      setCasesData(casesMonthly);

      // Clients by month
      const clientsMonthly = Array(12).fill(0).map((_, i) => ({
        month: monthNames[i],
        currentYear: 0,
        previousYear: 0
      }));

      allClients.forEach((client: any) => {
        const date = client.created_at ? new Date(client.created_at) : null;
        if (date) {
          if (date.getFullYear() === currentYear) {
            clientsMonthly[date.getMonth()].currentYear++;
          } else if (enableComparison && compareYear && date.getFullYear() === parseInt(compareYear)) {
            clientsMonthly[date.getMonth()].previousYear++;
          }
        }
      });

      setClientsData(clientsMonthly);

      // Revenue by month
      const revenueMonthly = Array(12).fill(0).map((_, i) => ({
        month: monthNames[i],
        currentYear: 0,
        previousYear: 0
      }));

      allInvoices.forEach((invoice: any) => {
        const date = invoice.issue_date ? new Date(invoice.issue_date) : null;
        if (date && invoice.status === 'paid') {
          if (date.getFullYear() === currentYear) {
            revenueMonthly[date.getMonth()].currentYear += invoice.amount || 0;
          } else if (enableComparison && compareYear && date.getFullYear() === parseInt(compareYear)) {
            revenueMonthly[date.getMonth()].previousYear += invoice.amount || 0;
          }
        }
      });

      setRevenueData(revenueMonthly);

      // Cases by status
      const statusCounts: Record<string, number> = {};
      allCases.forEach((case_: any) => {
        const status = case_.status || 'غير محدد';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value
      }));

      setStatusData(statusChartData);

      // Cases by type
      const typeCounts: Record<string, number> = {};
      allCases.forEach((case_: any) => {
        const type = case_.case_type || 'غير محدد';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value
      }));

      setTypeData(typeChartData);

      // Overall statistics for current year
      const currentYearCases = allCases.filter((c: any) => {
        const date = c.filed_date ? new Date(c.filed_date) : c.createdAt ? new Date(c.createdAt) : null;
        return date && date.getFullYear() === currentYear;
      });
      
      const activeCases = currentYearCases.filter((c: any) => c.status === "نشطة" || c.status === "جارية").length;
      const closedCases = currentYearCases.filter((c: any) => c.status === "مغلقة" || c.status === "منتهية").length;
      
      const currentYearClients = allClients.filter((c: any) => {
        const date = c.created_at ? new Date(c.created_at) : null;
        return date && date.getFullYear() === currentYear;
      });
      
      const currentYearRevenue = allInvoices
        .filter((inv: any) => {
          const date = inv.issue_date ? new Date(inv.issue_date) : null;
          return date && date.getFullYear() === currentYear && inv.status === 'paid';
        })
        .reduce((sum, inv: any) => sum + (inv.amount || 0), 0);

      setMonthlyStats({
        totalCases: currentYearCases.length,
        totalClients: currentYearClients.length,
        totalRevenue: currentYearRevenue,
        totalDocuments: documentsSnap.size,
        activeCases,
        closedCases
      });

      // Comparison year statistics
      if (enableComparison && compareYear) {
        const compareYearInt = parseInt(compareYear);
        
        const compareYearCases = allCases.filter((c: any) => {
          const date = c.filed_date ? new Date(c.filed_date) : c.createdAt ? new Date(c.createdAt) : null;
          return date && date.getFullYear() === compareYearInt;
        });
        
        const compareYearClients = allClients.filter((c: any) => {
          const date = c.created_at ? new Date(c.created_at) : null;
          return date && date.getFullYear() === compareYearInt;
        });
        
        const compareYearRevenue = allInvoices
          .filter((inv: any) => {
            const date = inv.issue_date ? new Date(inv.issue_date) : null;
            return date && date.getFullYear() === compareYearInt && inv.status === 'paid';
          })
          .reduce((sum, inv: any) => sum + (inv.amount || 0), 0);

        setCompareMonthlyStats({
          totalCases: compareYearCases.length,
          totalClients: compareYearClients.length,
          totalRevenue: compareYearRevenue,
          totalDocuments: 0,
          activeCases: 0,
          closedCases: 0
        });

        // Calculate growth percentages
        const casesGrowth = compareYearCases.length > 0 
          ? ((currentYearCases.length - compareYearCases.length) / compareYearCases.length) * 100 
          : 0;
        const clientsGrowth = compareYearClients.length > 0 
          ? ((currentYearClients.length - compareYearClients.length) / compareYearClients.length) * 100 
          : 0;
        const revenueGrowth = compareYearRevenue > 0 
          ? ((currentYearRevenue - compareYearRevenue) / compareYearRevenue) * 100 
          : 0;

        setGrowthStats({
          casesGrowth,
          clientsGrowth,
          revenueGrowth,
          documentsGrowth: 0
        });
      }

    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: "جاري التحضير للطباعة...",
      description: "الرجاء الانتظار قليلاً",
    });

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "خطأ",
        description: "تعذر فتح نافذة الطباعة",
        variant: "destructive",
      });
      return;
    }

    // Format date in Arabic with English numbers
    const now = new Date();
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    // Convert to English numbers by using default number formatting
    const formattedDate = `${String(now.getDate())} ${arabicMonths[now.getMonth()]} ${String(now.getFullYear())}`;

    // Get office info from localStorage
    const officeName = localStorage.getItem('officeName') || 'مكتب المحاماة';
    const officeAddress = localStorage.getItem('officeAddress') || '';
    const officePhone = localStorage.getItem('officePhone') || '';
    const officeEmail = localStorage.getItem('officeEmail') || '';
    const officeWebsite = localStorage.getItem('officeWebsite') || '';
    const officeLogo = localStorage.getItem('officeLogo') || '';

    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير إحصائي - ${year}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            font-family: 'Cairo', sans-serif;
            box-sizing: border-box;
          }
          body {
            direction: rtl;
            padding: 40px;
            background: white;
            color: #1e293b;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px;
            border-bottom: 3px solid #6366f1;
            margin-bottom: 30px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .logo {
            max-width: 100px;
            max-height: 100px;
            object-fit: contain;
          }
          .office-info {
            text-align: right;
          }
          .office-name {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .office-details {
            font-size: 13px;
            color: #64748b;
            line-height: 1.6;
          }
          h1 {
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 28px;
            font-weight: 700;
          }
          h2 {
            color: #1e293b;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 22px;
            font-weight: 600;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 8px;
          }
          .date {
            color: #64748b;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          .stat-title {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .stat-value {
            color: #1e293b;
            font-size: 32px;
            font-weight: 700;
          }
          .stat-growth {
            color: #10b981;
            font-size: 14px;
            margin-top: 5px;
          }
          .stat-growth.negative {
            color: #ef4444;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 30px;
          }
          th {
            background-color: #6366f1;
            color: white;
            padding: 12px;
            text-align: right;
            border: 1px solid #4f46e5;
            font-weight: 600;
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: right;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .page-break {
            page-break-after: always;
          }
          @media print {
            body {
              padding: 20px;
            }
            .page-break {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            ${officeLogo ? `<img src="${officeLogo}" alt="Logo" class="logo" />` : ''}
            <div class="office-info">
              <div class="office-name">${officeName}</div>
              <div class="office-details">
                ${officeAddress ? `<div>📍 ${officeAddress}</div>` : ''}
                ${officePhone ? `<div>📞 ${officePhone}</div>` : ''}
                ${officeEmail ? `<div>📧 ${officeEmail}</div>` : ''}
                ${officeWebsite ? `<div>🌐 ${officeWebsite}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <h1>تقرير إحصائي شامل</h1>
        <div class="date">التاريخ: ${formattedDate} | السنة: ${year}${enableComparison ? ` (مقارنة مع ${compareYear})` : ''}</div>
        
        <h2>الإحصائيات العامة</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">إجمالي القضايا</div>
            <div class="stat-value">${monthlyStats.totalCases}</div>
            ${enableComparison ? `<div class="stat-growth ${growthStats.casesGrowth >= 0 ? '' : 'negative'}">${growthStats.casesGrowth >= 0 ? '+' : ''}${growthStats.casesGrowth.toFixed(1)}%</div>` : ''}
          </div>
          <div class="stat-card">
            <div class="stat-title">إجمالي العملاء</div>
            <div class="stat-value">${monthlyStats.totalClients}</div>
            ${enableComparison ? `<div class="stat-growth ${growthStats.clientsGrowth >= 0 ? '' : 'negative'}">${growthStats.clientsGrowth >= 0 ? '+' : ''}${growthStats.clientsGrowth.toFixed(1)}%</div>` : ''}
          </div>
          <div class="stat-card">
            <div class="stat-title">إجمالي الإيرادات</div>
            <div class="stat-value">${monthlyStats.totalRevenue.toLocaleString('en-US')} د.م</div>
            ${enableComparison ? `<div class="stat-growth ${growthStats.revenueGrowth >= 0 ? '' : 'negative'}">${growthStats.revenueGrowth >= 0 ? '+' : ''}${growthStats.revenueGrowth.toFixed(1)}%</div>` : ''}
          </div>
          <div class="stat-card">
            <div class="stat-title">إجمالي المستندات</div>
            <div class="stat-value">${monthlyStats.totalDocuments}</div>
            ${enableComparison ? `<div class="stat-growth ${growthStats.documentsGrowth >= 0 ? '' : 'negative'}">${growthStats.documentsGrowth >= 0 ? '+' : ''}${growthStats.documentsGrowth.toFixed(1)}%</div>` : ''}
          </div>
        </div>

        <h2>القضايا حسب الشهر</h2>
        <table>
          <thead>
            <tr>
              <th>الشهر</th>
              <th>عدد القضايا</th>
              ${enableComparison ? '<th>السنة السابقة</th><th>التغير</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${casesData.map(row => `
              <tr>
                <td>${row.month}</td>
                <td>${row.cases || 0}</td>
                ${enableComparison ? `
                  <td>${row.lastYearCases || 0}</td>
                  <td>${((row.cases || 0) - (row.lastYearCases || 0))}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="page-break"></div>

        <h2>العملاء حسب الشهر</h2>
        <table>
          <thead>
            <tr>
              <th>الشهر</th>
              <th>عدد العملاء</th>
              ${enableComparison ? '<th>السنة السابقة</th><th>التغير</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${clientsData.map(row => `
              <tr>
                <td>${row.month}</td>
                <td>${row.clients || 0}</td>
                ${enableComparison ? `
                  <td>${row.lastYearClients || 0}</td>
                  <td>${((row.clients || 0) - (row.lastYearClients || 0))}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>الإيرادات حسب الشهر</h2>
        <table>
          <thead>
            <tr>
              <th>الشهر</th>
              <th>الإيرادات (د.م)</th>
              ${enableComparison ? '<th>السنة السابقة (د.م)</th><th>التغير</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${revenueData.map(row => `
              <tr>
                <td>${row.month}</td>
                <td>${(row.revenue || 0).toLocaleString('ar-MA')}</td>
                ${enableComparison ? `
                  <td>${(row.lastYearRevenue || 0).toLocaleString('ar-MA')}</td>
                  <td>${((row.revenue || 0) - (row.lastYearRevenue || 0)).toLocaleString('ar-MA')}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="page-break"></div>

        <h2>توزيع القضايا حسب الحالة</h2>
        <table>
          <thead>
            <tr>
              <th>الحالة</th>
              <th>العدد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${statusData.map(row => `
              <tr>
                <td>${row.name}</td>
                <td>${row.value}</td>
                <td>${((row.value / monthlyStats.totalCases) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>توزيع القضايا حسب النوع</h2>
        <table>
          <thead>
            <tr>
              <th>النوع</th>
              <th>العدد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${typeData.map(row => `
              <tr>
                <td>${row.name}</td>
                <td>${row.value}</td>
                <td>${((row.value / monthlyStats.totalCases) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
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
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-3 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center shadow-lg">
              <BarChart3 className="w-9 h-9 text-primary-dark" />
            </div>
            {t('reports')}
          </h1>
          <p className="text-muted-foreground text-lg mr-20">{t('dashboardOverview')}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 h-12 border-2 border-accent/20">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={enableComparison ? "default" : "outline"}
              onClick={() => {
                setEnableComparison(!enableComparison);
                if (!enableComparison) {
                  setCompareYear((parseInt(year) - 1).toString());
                }
              }}
              className={enableComparison ? "bg-accent hover:bg-accent/90" : "border-2 border-accent/20"}
            >
              مقارنة
            </Button>
            
            {enableComparison && (
              <Select value={compareYear} onValueChange={setCompareYear}>
                <SelectTrigger className="w-32 h-12 border-2 border-primary/20">
                  <SelectValue placeholder="مقارنة مع" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
                    .filter(y => y.toString() !== year)
                    .map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <Button 
            onClick={exportReport}
            disabled={loading}
            variant="outline"
            className="border-2 border-accent/20 hover:bg-accent/10"
          >
            <FileDown className="w-5 h-5 ml-2" />
            {t('export')} PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card border-2 hover:border-accent/30 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-accent" />
              إجمالي القضايا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {loading ? <Skeleton className="h-12 w-24" /> : monthlyStats.totalCases}
            </div>
            {enableComparison && compareYear && (
              <div className={`text-sm font-semibold mt-2 flex items-center gap-1 ${growthStats.casesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-4 h-4 ${growthStats.casesGrowth < 0 ? 'rotate-180' : ''}`} />
                {growthStats.casesGrowth >= 0 ? '+' : ''}{growthStats.casesGrowth.toFixed(1)}% مقارنة بـ {compareYear}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              نشطة: {monthlyStats.activeCases} | مغلقة: {monthlyStats.closedCases}
            </p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-2 hover:border-accent/30 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-accent" />
              إجمالي العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {loading ? <Skeleton className="h-12 w-24" /> : monthlyStats.totalClients}
            </div>
            {enableComparison && compareYear && (
              <div className={`text-sm font-semibold mt-2 flex items-center gap-1 ${growthStats.clientsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-4 h-4 ${growthStats.clientsGrowth < 0 ? 'rotate-180' : ''}`} />
                {growthStats.clientsGrowth >= 0 ? '+' : ''}{growthStats.clientsGrowth.toFixed(1)}% مقارنة بـ {compareYear}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">عملاء {year}</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-2 hover:border-accent/30 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-accent" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {loading ? <Skeleton className="h-12 w-32" /> : `${monthlyStats.totalRevenue.toLocaleString('en')} د.م`}
            </div>
            {enableComparison && compareYear && (
              <div className={`text-sm font-semibold mt-2 flex items-center gap-1 ${growthStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-4 h-4 ${growthStats.revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                {growthStats.revenueGrowth >= 0 ? '+' : ''}{growthStats.revenueGrowth.toFixed(1)}% مقارنة بـ {compareYear}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">إيرادات {year}</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-2 hover:border-accent/30 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-accent" />
              إجمالي المستندات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">
              {loading ? <Skeleton className="h-12 w-24" /> : monthlyStats.totalDocuments}
            </div>
            <p className="text-sm text-muted-foreground mt-2">جميع المستندات المخزنة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50 p-2 rounded-xl h-auto">
          <TabsTrigger value="cases" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3">
            <Briefcase className="w-4 h-4 ml-2" />
            القضايا
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3">
            <Users className="w-4 h-4 ml-2" />
            العملاء
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3">
            <TrendingUp className="w-4 h-4 ml-2" />
            الإيرادات
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg py-3">
            <PieChart className="w-4 h-4 ml-2" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-6 mt-6">
          <Card className="luxury-card" ref={casesChartRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="w-6 h-6 text-accent" />
                القضايا الشهرية - {year}
              </CardTitle>
              <CardDescription>عدد القضايا المضافة كل شهر</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={casesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="currentYear" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name={year} />
                    {enableComparison && compareYear && (
                      <Bar dataKey="previousYear" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name={compareYear} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6 mt-6">
          <Card className="luxury-card" ref={clientsChartRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-6 h-6 text-accent" />
                العملاء الجدد - {year}
              </CardTitle>
              <CardDescription>عدد العملاء المسجلين كل شهر</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={clientsData}>
                    <defs>
                      <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="currentYear" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorClients)"
                      name={year}
                    />
                    {enableComparison && compareYear && (
                      <Area 
                        type="monotone" 
                        dataKey="previousYear" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        fill="none"
                        strokeDasharray="5 5"
                        name={compareYear}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <Card className="luxury-card" ref={revenueChartRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="w-6 h-6 text-accent" />
                الإيرادات الشهرية - {year}
              </CardTitle>
              <CardDescription>إجمالي الإيرادات من الفواتير المدفوعة</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${value.toLocaleString('en')} د.م`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="currentYear" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))', r: 6 }}
                      name={year}
                    />
                    {enableComparison && compareYear && (
                      <Line 
                        type="monotone" 
                        dataKey="previousYear" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                        name={compareYear}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="luxury-card" ref={statusChartRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PieChart className="w-6 h-6 text-accent" />
                  توزيع القضايا حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsPie>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="hsl(var(--accent))"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="luxury-card" ref={typeChartRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PieChart className="w-6 h-6 text-accent" />
                  توزيع القضايا حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsPie>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default Reports;
