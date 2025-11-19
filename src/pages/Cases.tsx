import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Briefcase, Plus, Search, Edit, Trash2, FileDown } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { AddCaseDialog } from '@/components/AddCaseDialog';
import { EditCaseDialog } from '@/components/EditCaseDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { caseFields } from '@/lib/exportUtils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  case_type: string;
  client_id: string;
  filed_date: string | null;
  next_hearing_date: string | null;
  created_at: string;
}

const Cases = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'cases'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const casesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Case[];
        setCases(casesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching cases:', error);
        toast.error('فشل في تحميل القضايا');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-500/10 text-green-500 border-green-500/20',
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'closed': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusText = (status: string) => {
    const statuses = { 
      'active': t('statusActive'), 
      'pending': t('statusPending'), 
      'closed': t('statusClosed'),
      'on-hold': t('statusOnHold')
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-500/10 text-red-500 border-red-500/20',
      'medium': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'low': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityText = (priority: string) => {
    const priorities = { 
      'high': t('priorityHigh'), 
      'medium': t('priorityMedium'), 
      'low': t('priorityLow'),
      'urgent': t('priorityUrgent')
    };
    return priorities[priority as keyof typeof priorities] || priority;
  };

  const filteredCases = cases.filter(case_ => {
    const search = searchTerm.toLowerCase();
    return (
      case_.title.toLowerCase().includes(search) ||
      case_.case_number.toLowerCase().includes(search) ||
      case_.case_type.toLowerCase().includes(search) ||
      case_.status.toLowerCase().includes(search) ||
      case_.priority.toLowerCase().includes(search) ||
      ((case_ as any).court_name?.toLowerCase() || '').includes(search) ||
      ((case_ as any).description?.toLowerCase() || '').includes(search)
    );
  });

  const activeCases = cases.filter(c => c.status === 'active').length;
  const closedCases = cases.filter(c => c.status === 'closed').length;
  const upcomingHearings = cases.filter(c => c.next_hearing_date).length;

  const handleEdit = (caseData: Case) => {
    setSelectedCase(caseData);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (caseData: Case) => {
    setSelectedCase(caseData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return;

    try {
      await deleteDoc(doc(db, 'cases', selectedCase.id));
      toast.success('تم حذف القضية بنجاح');
      setDeleteDialogOpen(false);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('فشل في حذف القضية');
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
      <AddCaseDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onCaseAdded={() => {}}
      />
      
      {selectedCase && (
        <>
          <EditCaseDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            caseData={selectedCase}
            onCaseUpdated={() => {}}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title="تأكيد حذف القضية"
            description={`هل أنت متأكد من حذف القضية "${selectedCase.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          />
        </>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={filteredCases}
        fields={caseFields}
        title="تقرير القضايا"
        filename={`cases-${new Date().toISOString().split('T')[0]}`}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('cases')}</h1>
            <p className="text-muted-foreground mt-1">{t('casesManagement')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setExportDialogOpen(true)}
              variant="outline"
              disabled={cases.length === 0}
            >
              <FileDown className="ml-2 h-4 w-4" />
              {t('export')}
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
            >
              <Plus className="ml-2 h-4 w-4" />
              {t('addCase')}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchCases')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="القضايا النشطة"
          value={activeCases.toString()}
          icon={Briefcase}
          trend={{ value: 'قضايا جارية', isPositive: true }}
        />
        <StatsCard
          title="القضايا المغلقة"
          value={closedCases.toString()}
          icon={Briefcase}
          trend={{ value: 'قضايا منتهية', isPositive: false }}
        />
        <StatsCard
          title="جلسات قادمة"
          value={upcomingHearings.toString()}
          icon={Briefcase}
          trend={{ value: 'جلسات محددة', isPositive: true }}
        />
        <StatsCard
          title="إجمالي القضايا"
          value={cases.length.toString()}
          icon={Briefcase}
          trend={{ value: 'جميع القضايا', isPositive: true }}
        />
      </div>

      {filteredCases.length === 0 ? (
        searchTerm ? (
          <Card className="luxury-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground text-center mb-6">جرب البحث بكلمات مختلفة</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="luxury-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">لا يوجد قضايا</h3>
              <p className="text-muted-foreground text-center mb-6">ابدأ بإضافة قضية جديدة</p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة قضية
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="luxury-card hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{case_.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">رقم القضية: {case_.case_number}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge className={getStatusColor(case_.status)}>{getStatusText(case_.status)}</Badge>
                    <Badge className={getPriorityColor(case_.priority)}>{getPriorityText(case_.priority)}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(case_)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(case_)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">نوع القضية</p>
                    <p className="font-semibold text-foreground">{case_.case_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تاريخ التقديم</p>
                    <p className="font-semibold text-foreground">{case_.filed_date || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الجلسة القادمة</p>
                    <p className="font-semibold text-foreground">{case_.next_hearing_date || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-semibold text-foreground english-nums">
                      {(() => {
                        const date = new Date(case_.created_at);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = String(date.getFullYear());
                        return `${day}/${month}/${year}`;
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cases;
