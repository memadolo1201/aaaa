import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Users, Briefcase, FileText, TrendingUp, Clock, CheckCircle2, BarChart3, Scale, AlertCircle, Calendar, MapPin, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/AddClientDialog";
import { AddDocumentDialog } from "@/components/AddDocumentDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import { AddInvoiceDialog } from "@/components/AddInvoiceDialog";
import { NotificationsCard } from "@/components/NotificationsCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: t('totalClients'), value: "0", icon: Users },
    { title: t('activeCases'), value: "0", icon: Briefcase },
    { title: t('totalDocuments'), value: "0", icon: FileText },
    { title: t('revenue'), value: "0 د.م", icon: TrendingUp }
  ]);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [upcomingCases, setUpcomingCases] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [snoozedNotifications, setSnoozedNotifications] = useState<Record<string, number>>({});
  const [casesChartData, setCasesChartData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Load snoozed notifications from localStorage
    const storedSnoozed = localStorage.getItem('snoozedNotifications');
    if (storedSnoozed) {
      try {
        const parsed = JSON.parse(storedSnoozed);
        // Remove expired snoozes
        const nowTimestamp = Date.now();
        const filtered: Record<string, number> = {};
        Object.entries(parsed).forEach(([id, time]: [string, any]) => {
          if (typeof time === 'number' && time > nowTimestamp) {
            filtered[id] = time;
          }
        });
        setSnoozedNotifications(filtered);
        localStorage.setItem('snoozedNotifications', JSON.stringify(filtered));
      } catch (e) {
        console.error('Error loading snoozed notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch clients count
        const clientsQuery = query(
          collection(db, "clients"),
          where('user_id', '==', user.uid)
        );
        const clientsSnap = await getDocs(clientsQuery);
        const clientsCount = clientsSnap.size;

        // Fetch active cases count and recent cases
        const casesQuery = query(
          collection(db, "cases"),
          where('user_id', '==', user.uid)
        );
        const casesSnap = await getDocs(casesQuery);
        const allCases = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeCases = allCases.filter((c: any) => c.status === "نشطة" || c.status === "جارية");
        const sortedCases = allCases.sort((a: any, b: any) => 
          new Date(b.createdAt || b.filed_date).getTime() - new Date(a.createdAt || a.filed_date).getTime()
        ).slice(0, 4);

        // Fetch documents count
        const documentsQuery = query(
          collection(db, "documents"),
          where('user_id', '==', user.uid)
        );
        const documentsSnap = await getDocs(documentsQuery);
        const documentsCount = documentsSnap.size;

        // Fetch total revenue
        const invoicesQuery = query(
          collection(db, "invoices"),
          where('user_id', '==', user.uid)
        );
        const invoicesSnap = await getDocs(invoicesQuery);
        const totalRevenue = invoicesSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);

        // Fetch upcoming appointments (next 3)
        const eventsQuery = query(
          collection(db, "calendar_events"),
          where('user_id', '==', user.uid)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = allEvents
          .filter((event: any) => new Date(event.event_date) >= today)
          .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
          .slice(0, 3);

        // Update stats
        setStats([
          { title: t('totalClients'), value: clientsCount.toString(), icon: Users },
          { title: t('activeCases'), value: activeCases.length.toString(), icon: Briefcase },
          { title: t('totalDocuments'), value: documentsCount.toString(), icon: FileText },
          { title: t('revenue'), value: totalRevenue.toLocaleString('en') + " د.م", icon: TrendingUp }
        ]);

        // Get upcoming cases with hearings
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const upcoming30Days = new Date();
        upcoming30Days.setDate(todayDate.getDate() + 30);
        
        const upcomingCasesData = allCases
          .filter((c: any) => {
            if (!c.next_hearing_date) return false;
            const hearingDate = new Date(c.next_hearing_date);
            hearingDate.setHours(0, 0, 0, 0);
            return hearingDate >= todayDate && hearingDate <= upcoming30Days;
          })
          .sort((a: any, b: any) => 
            new Date(a.next_hearing_date).getTime() - new Date(b.next_hearing_date).getTime()
          )
          .slice(0, 5);

        setRecentCases(sortedCases);
        setUpcomingCases(upcomingCasesData);
        setUpcomingAppointments(upcoming);

        // Prepare notifications
        const notificationsList: any[] = [];
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Add event notifications (only future events in next 7 days)
        allEvents.forEach((event: any) => {
          const eventDate = new Date(event.event_date);
          const timeString = event.event_time || "00:00";
          const [hours, minutes] = timeString.split(':');
          eventDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          
          // Only show future events
          if (eventDate > now && eventDate <= sevenDaysFromNow) {
            const diffMs = eventDate.getTime() - now.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            const remainingHours = diffHours % 24;
            
            let priority = "low";
            let timeRemaining = "";
            
            if (diffHours < 2) {
              priority = "high";
              timeRemaining = "أقل من ساعتين";
            } else if (diffHours < 24) {
              priority = "high";
              timeRemaining = `${diffHours} ساعة`;
            } else if (diffDays === 1) {
              priority = "high";
              timeRemaining = remainingHours > 0 ? `يوم و ${remainingHours} ساعة` : "يوم واحد";
            } else if (diffDays <= 3) {
              priority = "medium";
              timeRemaining = `${diffDays} أيام`;
            } else {
              priority = "low";
              timeRemaining = `${diffDays} أيام`;
            }
            
            // Format date manually to ensure Gregorian calendar
            const day = String(eventDate.getDate()).padStart(2, '0');
            const month = String(eventDate.getMonth() + 1).padStart(2, '0');
            const year = String(eventDate.getFullYear());
            const gregorianDate = `${day}/${month}/${year}`;

            notificationsList.push({
              id: `event-${event.id}`,
              type: "event",
              title: event.title,
              message: `موعد ${event.event_type} - متبقي ${timeRemaining}`,
              date: gregorianDate,
              priority
            });
          }
        });

        // Add case hearing notifications (only future hearings)
        allCases.forEach((case_: any) => {
          if (case_.next_hearing_date) {
            const hearingDate = new Date(case_.next_hearing_date);
            hearingDate.setHours(0, 0, 0, 0);
            
            // Only show future hearings within 7 days
            if (hearingDate >= now && hearingDate <= sevenDaysFromNow) {
              const diffMs = hearingDate.getTime() - now.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              let priority = "low";
              let timeRemaining = "";
              
              if (diffDays === 0) {
                priority = "high";
                timeRemaining = "اليوم";
              } else if (diffDays === 1) {
                priority = "high";
                timeRemaining = "غداً";
              } else if (diffDays <= 3) {
                priority = "medium";
                timeRemaining = `${diffDays} أيام`;
              } else {
                priority = "low";
                timeRemaining = `${diffDays} أيام`;
              }
              
              const day = String(hearingDate.getDate()).padStart(2, '0');
              const month = String(hearingDate.getMonth() + 1).padStart(2, '0');
              const year = String(hearingDate.getFullYear());
              const gregorianDate = `${day}/${month}/${year}`;

              notificationsList.push({
                id: `case-hearing-${case_.id}`,
                type: "case",
                title: case_.title,
                message: `جلسة قضية - متبقي ${timeRemaining}`,
                date: gregorianDate,
                priority
              });
            }
          }
        });

        // Add invoice notifications (only future pending invoices)
        const allInvoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allInvoices.forEach((invoice: any) => {
          if (invoice.status === "pending" || invoice.status === "قيد الانتظار") {
            const dueDate = new Date(invoice.due_date);
            dueDate.setHours(23, 59, 59, 999); // End of day
            
            // Only show if not yet passed
            if (dueDate >= now) {
              const diffMs = dueDate.getTime() - now.getTime();
              const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              let priority = "low";
              let timeRemaining = "";

              if (daysUntilDue <= 1) {
                priority = "high";
                timeRemaining = "اليوم أو غداً";
              } else if (daysUntilDue <= 3) {
                priority = "high";
                timeRemaining = `${daysUntilDue} أيام`;
              } else if (daysUntilDue <= 7) {
                priority = "medium";
                timeRemaining = `${daysUntilDue} أيام`;
              } else {
                return; // Skip invoices due after 7 days
              }
              
              // Format date manually to ensure Gregorian calendar
              const day = String(dueDate.getDate()).padStart(2, '0');
              const month = String(dueDate.getMonth() + 1).padStart(2, '0');
              const year = String(dueDate.getFullYear());
              const gregorianDate = `${day}/${month}/${year}`;

              notificationsList.push({
                id: `invoice-${invoice.id}`,
                type: "invoice",
                title: `فاتورة رقم ${invoice.invoice_number}`,
                message: `مبلغ ${invoice.amount.toLocaleString('en')} د.م - متبقي ${timeRemaining}`,
                date: gregorianDate,
                priority
              });
            }
          }
        });

        // Sort by priority
        notificationsList.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        });

        // Filter out snoozed notifications
        const nowTimestamp = Date.now();
        const filtered = notificationsList.filter(notification => {
          const snoozeTime = snoozedNotifications[notification.id];
          return !snoozeTime || snoozeTime <= nowTimestamp;
        });

        setNotifications(filtered);

        // Send browser notifications for urgent cases (today or tomorrow)
        const urgentNotifications = filtered.filter(n => 
          n.type === 'case' && n.priority === 'high'
        );
        
        // Check notification settings
        const soundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
        const notificationDays = parseInt(localStorage.getItem('notificationDaysBefore') || '1');
        
        if (urgentNotifications.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
          // Check if we already sent notifications today
          const lastNotificationDate = localStorage.getItem('lastNotificationDate');
          const today = new Date().toDateString();
          
          if (lastNotificationDate !== today) {
            urgentNotifications.forEach(notification => {
              // Calculate days until the case
              const caseDate = new Date(notification.date.split('/').reverse().join('-'));
              const daysUntil = Math.ceil((caseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              // Only notify if within the configured time range
              if (daysUntil <= notificationDays) {
                // Play notification sound if enabled
                if (soundEnabled) {
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAo=');
                  audio.play().catch(e => console.log('Could not play sound:', e));
                }
                
                new Notification('تنبيه قضية مهمة', {
                  body: `${notification.title}\n${notification.message}\nالموعد: ${notification.date}`,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: notification.id,
                  requireInteraction: true,
                  silent: !soundEnabled
                });
              }
            });
            
            localStorage.setItem('lastNotificationDate', today);
          }
        }

        // Prepare chart data - last 12 months
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        const currentDate = new Date();
        const chartData = [];
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthName = monthNames[date.getMonth()];
          
          // Count cases for this month
          const casesInMonth = allCases.filter((c: any) => {
            const caseDate = new Date(c.createdAt || c.filed_date);
            return caseDate.getMonth() === date.getMonth() && caseDate.getFullYear() === date.getFullYear();
          }).length;
          
          // Calculate revenue for this month
          const revenueInMonth = invoicesSnap.docs.filter(doc => {
            const invoiceData = doc.data();
            const invoiceDate = new Date(invoiceData.issue_date);
            return invoiceDate.getMonth() === date.getMonth() && invoiceDate.getFullYear() === date.getFullYear();
          }).reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
          
          chartData.push({
            month: monthName,
            cases: casesInMonth,
            revenue: revenueInMonth
          });
        }
        
        setCasesChartData(chartData);
        setRevenueChartData(chartData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [snoozedNotifications, user]);

  // Check snoozed notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updated = { ...snoozedNotifications };
      let hasChanges = false;

      Object.keys(updated).forEach(id => {
        if (updated[id] <= now) {
          delete updated[id];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setSnoozedNotifications(updated);
        localStorage.setItem('snoozedNotifications', JSON.stringify(updated));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [snoozedNotifications]);

  const handleSnooze = (notificationId: string, minutes: number) => {
    const snoozeUntil = Date.now() + (minutes * 60 * 1000);
    const updated = { ...snoozedNotifications, [notificationId]: snoozeUntil };
    setSnoozedNotifications(updated);
    localStorage.setItem('snoozedNotifications', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('welcomeBack')}{user?.displayName ? `, ${user.displayName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground">{t('dashboardOverview')}</p>
        </div>
        <Button className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all">
          + {t('newCase')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="luxury-card">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className="animate-scale-in"
            />
          ))
        )}
      </div>

      {/* Notifications */}
      {(notifications.length > 0 || loading) && (
        <div className="mb-6">
          <NotificationsCard notifications={notifications} loading={loading} onSnooze={handleSnooze} />
        </div>
      )}

      {/* Upcoming Cases with Hearings */}
      {(upcomingCases.length > 0 || loading) && (
        <Card className="luxury-card border-2 border-accent/30 shadow-xl bg-gradient-to-br from-accent/5 via-background to-accent/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center shadow-lg">
                  <Scale className="w-6 h-6 text-accent-foreground" />
                </div>
                <span className="bg-gradient-to-l from-accent to-accent-dark bg-clip-text text-transparent font-bold">
                  {t('upcomingCasesWithHearings')}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40">
                <AlertCircle className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-sm font-bold text-accent">
                  {loading ? "..." : `${upcomingCases.length} جلسات قادمة`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : upcomingCases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد جلسات قادمة</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingCases.map((case_: any) => {
                  const hearingDate = new Date(case_.next_hearing_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffMs = hearingDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  
                  let urgencyColor = "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-400";
                  let urgencyText = "بعد أسبوع";
                  
                  if (diffDays === 0) {
                    urgencyColor = "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400";
                    urgencyText = "اليوم";
                  } else if (diffDays === 1) {
                    urgencyColor = "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-400";
                    urgencyText = "غداً";
                  } else if (diffDays <= 3) {
                    urgencyColor = "bg-yellow-500/20 border-yellow-500/40 text-yellow-700 dark:text-yellow-400";
                    urgencyText = `خلال ${diffDays} أيام`;
                  } else if (diffDays <= 7) {
                    urgencyColor = "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400";
                    urgencyText = `خلال ${diffDays} أيام`;
                  } else {
                    urgencyText = `خلال ${diffDays} يوم`;
                  }

                  return (
                    <div
                      key={case_.id}
                      className="group relative p-5 rounded-xl bg-card border-2 border-border hover:border-accent/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Urgency Badge */}
                      <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full border-2 ${urgencyColor} text-xs font-bold shadow-lg animate-pulse`}>
                        {urgencyText}
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-base mb-1 leading-tight line-clamp-2">
                              {case_.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              رقم القضية: {case_.case_number}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="font-semibold text-foreground english-nums">
                            {(() => {
                              const day = String(hearingDate.getDate()).padStart(2, '0');
                              const month = String(hearingDate.getMonth() + 1).padStart(2, '0');
                              const year = String(hearingDate.getFullYear());
                              return `${day}/${month}/${year}`;
                            })()}
                          </span>
                        </div>

                        {case_.court_name && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            📍 {case_.court_name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2 luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="w-5 h-5 text-accent" />
              {t('recentCases')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {recentCases.map((case_: any) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all border border-border/50"
                  >
                  <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{case_.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {case_.filed_date || case_.createdAt}
                        </span>
                        {case_.priority && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            case_.priority === 'عالية' 
                              ? 'bg-red-100 text-red-700' 
                              : case_.priority === 'متوسطة'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {case_.priority}
                          </span>
                        )}
                      </div>
                      {case_.next_hearing_date && (() => {
                        const hearingDate = new Date(case_.next_hearing_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        hearingDate.setHours(0, 0, 0, 0);
                        
                        // Only show if future hearing
                        if (hearingDate >= today) {
                          const day = String(hearingDate.getDate()).padStart(2, '0');
                          const month = String(hearingDate.getMonth() + 1).padStart(2, '0');
                          const year = String(hearingDate.getFullYear());
                          
                          return (
                            <div className="mt-2 flex items-center gap-1 text-xs text-accent font-medium">
                              <Clock className="w-3 h-3" />
                              الجلسة القادمة: <span className="english-nums">{day}/{month}/{year}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {case_.status && (
                      <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        {case_.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-5 h-5 text-accent" />
              {t('upcomingAppointments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment: any) => {
                  const eventDate = new Date(appointment.event_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  // Format date manually to ensure Gregorian calendar
                  const day = String(eventDate.getDate()).padStart(2, '0');
                  const month = String(eventDate.getMonth() + 1).padStart(2, '0');
                  const year = String(eventDate.getFullYear());
                  const fullDate = `${day}/${month}/${year}`;
                  
                  let dateLabel = fullDate;
                  let dateBadgeColor = "bg-primary/10 text-primary";
                  
                  if (eventDate.getTime() === today.getTime()) {
                    dateLabel = "اليوم";
                    dateBadgeColor = "bg-accent text-accent-foreground";
                  } else if (eventDate.getTime() === tomorrow.getTime()) {
                    dateLabel = "غداً";
                    dateBadgeColor = "bg-accent/80 text-accent-foreground";
                  }

                  const getEventIcon = (type: string) => {
                    switch (type) {
                      case 'جلسة محكمة':
                        return Calendar;
                      case 'اجتماع عميل':
                        return Users;
                      case 'موعد استشارة':
                        return FileText;
                      default:
                        return CheckCircle2;
                    }
                  };

                  const EventIcon = getEventIcon(appointment.event_type);

                  return (
                    <div
                      key={appointment.id}
                      className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative p-5">
                        <div className="flex items-start gap-4">
                          {/* Icon Section */}
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-sm">
                              <EventIcon className="w-7 h-7 text-accent-foreground" />
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <h4 className="font-bold text-foreground text-lg leading-relaxed mb-1">
                                {appointment.title}
                              </h4>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                <Circle className="w-2 h-2 fill-current" />
                                {appointment.event_type}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span className="english-nums font-medium">{appointment.event_time}</span>
                              </div>

                              {appointment.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">{appointment.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date Badge - Full Width Bottom */}
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className={`w-full text-center px-4 py-2 rounded-lg ${dateBadgeColor} font-bold text-base english-nums shadow-sm`}>
                            {dateLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases Performance Chart */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="w-5 h-5 text-accent" />
              {t('casesPerformance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={casesChartData}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cases" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    fill="url(#colorCases)"
                    name="القضايا"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-5 h-5 text-accent" />
              {t('monthlyRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any) => `${value.toLocaleString('en')} د.م`}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                    name="الإيرادات"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="text-xl">{t('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-accent/10 hover:border-accent transition-all"
              onClick={() => setIsClientDialogOpen(true)}
            >
              <Users className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium">{t('addNewClient')}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-accent/10 hover:border-accent transition-all"
              onClick={() => setIsDocumentDialogOpen(true)}
            >
              <FileText className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium">{t('addDocumentBtn')}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-accent/10 hover:border-accent transition-all"
              onClick={() => setIsEventDialogOpen(true)}
            >
              <Clock className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium">{t('scheduleEvent')}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-accent/10 hover:border-accent transition-all"
              onClick={() => setIsInvoiceDialogOpen(true)}
            >
              <TrendingUp className="w-6 h-6 text-accent" />
              <span className="text-sm font-medium">{t('createInvoice')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddClientDialog 
        open={isClientDialogOpen} 
        onOpenChange={setIsClientDialogOpen}
        onClientAdded={() => {}} 
      />
      <AddDocumentDialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen} />
      <AddEventDialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen} />
      <AddInvoiceDialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen} />
    </div>
  );
};

export default Index;
