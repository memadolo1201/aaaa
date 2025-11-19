import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Search, Edit, Trash2, Clock, MapPin, Users, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { AddEventDialog } from '@/components/AddEventDialog';
import { EditEventDialog } from '@/components/EditEventDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  event_time: string;
  location?: string;
  attendees?: string;
  created_at: string;
}

const CalendarPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'calendar_events'),
      where('user_id', '==', user.uid),
      orderBy('event_date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching events:', error);
      toast.error('فشل في تحميل الأحداث');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEvents = events.filter(event => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = (
      event.title.toLowerCase().includes(search) ||
      event.event_type.toLowerCase().includes(search) ||
      (event.location?.toLowerCase() || '').includes(search) ||
      (event.description?.toLowerCase() || '').includes(search) ||
      (event.attendees?.toLowerCase() || '').includes(search)
    );

    if (selectedDate) {
      const eventDate = new Date(event.event_date);
      return matchesSearch && isSameDay(eventDate, selectedDate);
    }

    return matchesSearch;
  });

  const eventDates = events.map(event => new Date(event.event_date));

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'جلسة محكمة': 'bg-destructive/10 text-destructive border-destructive/20',
      'اجتماع عميل': 'bg-primary/10 text-primary border-primary/20',
      'موعد استشارة': 'bg-accent/20 text-accent-foreground border-accent/30',
      'متابعة قضية': 'bg-secondary text-secondary-foreground border-border',
    };
    return colors[type] || 'bg-muted text-muted-foreground border-border';
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;

    try {
      await deleteDoc(doc(db, 'calendar_events', selectedEvent.id));
      toast.success('تم حذف الموعد بنجاح');
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('فشل في حذف الموعد');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AddEventDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {selectedEvent && (
        <>
          <EditEventDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            eventData={selectedEvent}
            onEventUpdated={() => {}}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title={selectedEvent.title}
            description="هل أنت متأكد من حذف هذا الموعد؟"
          />
        </>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('calendar')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedDate 
              ? `${format(selectedDate, 'dd MMMM yyyy', { locale: ar })}`
              : t('calendarManagement')
            }
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent shadow-md hover:shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.5)] text-primary transition-all"
        >
          <Plus className="ml-2 h-5 w-5" />
          {t('addEvent')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="grid lg:grid-cols-[400px,1fr] gap-6">
        <Card className="luxury-card h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-accent" />
              التقويم الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ar}
              className={cn("rounded-md border pointer-events-auto")}
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersClassNames={{
                hasEvent: 'font-bold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent-dark after:rounded-full after:shadow-sm',
              }}
            />
            {selectedDate && (
              <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(undefined)}
                className="w-full hover:bg-accent/10 hover:text-accent-dark hover:border-accent transition-all"
              >
                عرض جميع المواعيد
              </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {selectedDate ? 'لا توجد مواعيد في هذا اليوم' : 'لا توجد مواعيد'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedDate && 'حاول اختيار تاريخ آخر'}
                </p>
                {!selectedDate && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة أول موعد
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredEvents.map((event) => {
                const getEventIcon = (type: string) => {
                  switch (type) {
                    case 'جلسة محكمة':
                      return CalendarIcon;
                    case 'اجتماع عميل':
                      return Users;
                    case 'موعد استشارة':
                      return FileText;
                    default:
                      return CalendarIcon;
                  }
                };

                const EventIcon = getEventIcon(event.event_type);

                return (
                  <Card key={event.id} className="group hover:shadow-[0_8px_40px_-8px_hsl(var(--accent)/0.4)] hover:border-l-accent-light transition-all duration-300 overflow-hidden luxury-card relative border-l-4 border-l-accent">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-light to-accent" />
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.6)] transition-all duration-300">
                          <EventIcon className="w-7 h-7 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold text-foreground mb-2 leading-tight">
                            {event.title}
                          </CardTitle>
                          <Badge variant="outline" className={`${getEventTypeColor(event.event_type)} px-3 py-1 border`}>
                            {event.event_type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            <span>التاريخ</span>
                          </div>
                          <p className="font-bold text-foreground english-nums text-sm">
                            {(() => {
                              const date = new Date(event.event_date);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = String(date.getFullYear());
                              return `${day}/${month}/${year}`;
                            })()}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>الوقت</span>
                          </div>
                          <p className="font-bold text-foreground english-nums text-sm">{event.event_time}</p>
                        </div>
                      </div>

                      {event.location && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">المكان</p>
                              <p className="font-semibold text-foreground text-sm">{event.location}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {event.description && (
                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-accent-dark flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                              <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {event.attendees && (
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">الحضور</p>
                              <p className="text-sm text-foreground">{event.attendees}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-border/50 flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent shadow-md hover:shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.5)] transition-all"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(event)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
