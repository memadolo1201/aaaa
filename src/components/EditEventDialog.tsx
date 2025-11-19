import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData: any;
  onEventUpdated: () => void;
}

export const EditEventDialog = ({ open, onOpenChange, eventData, onEventUpdated }: EditEventDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    event_type: '',
    event_date: '',
    event_time: '',
    location: '',
    description: '',
    attendees: '',
  });

  useEffect(() => {
    if (open && eventData) {
      setFormData({
        title: eventData.title || '',
        event_type: eventData.event_type || '',
        event_date: eventData.event_date || '',
        event_time: eventData.event_time || '',
        location: eventData.location || '',
        description: eventData.description || '',
        attendees: eventData.attendees || '',
      });
    }
  }, [open, eventData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventRef = doc(db, 'calendar_events', eventData.id);
      await updateDoc(eventRef, {
        ...formData,
        updated_at: new Date().toISOString(),
      });

      toast.success('تم تحديث الموعد بنجاح');
      onEventUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('خطأ في تحديث الموعد');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">تعديل الموعد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">عنوان الموعد *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_type">نوع الموعد *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="جلسة محكمة">جلسة محكمة</SelectItem>
                  <SelectItem value="اجتماع عميل">اجتماع عميل</SelectItem>
                  <SelectItem value="استشارة">استشارة</SelectItem>
                  <SelectItem value="موعد شخصي">موعد شخصي</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">التاريخ *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">الوقت *</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">المكان</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="attendees">الحضور</Label>
              <Input
                id="attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="مثال: محمد أحمد، سارة محمود"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
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
