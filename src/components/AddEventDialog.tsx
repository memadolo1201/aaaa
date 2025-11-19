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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEventDialog({ open, onOpenChange }: AddEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    event_date: '',
    event_time: '',
    location: '',
    attendees: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      await addDoc(collection(db, 'calendar_events'), {
        ...formData,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success('تم إضافة الموعد بنجاح');
      onOpenChange(false);
      setFormData({ 
        title: '', 
        description: '', 
        event_type: '', 
        event_date: '', 
        event_time: '', 
        location: '', 
        attendees: '' 
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('فشل في إضافة الموعد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة موعد جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">عنوان الموعد</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_type">نوع الموعد</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="جلسة">جلسة</SelectItem>
                  <SelectItem value="اجتماع">اجتماع</SelectItem>
                  <SelectItem value="استشارة">استشارة</SelectItem>
                  <SelectItem value="مهمة">مهمة</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event_date">التاريخ</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event_time">الوقت</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">المكان (اختياري)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attendees">الحضور (اختياري)</Label>
              <Input
                id="attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="أسماء الحضور مفصولة بفاصلة"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
