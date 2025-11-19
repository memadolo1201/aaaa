import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateAdded: () => void;
}

export const AddTemplateDialog = ({
  open,
  onOpenChange,
  onTemplateAdded,
}: AddTemplateDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    template_type: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await addDoc(collection(db, "templates"), {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        template_type: formData.template_type,
        user_id: user.uid,
        content: {},
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success("تم إضافة القالب بنجاح");
      onTemplateAdded();
      setFormData({ title: "", description: "", category: "", template_type: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding template:", error);
      toast.error("فشل في إضافة القالب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة قالب جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان القالب</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="عقود">عقود</SelectItem>
                <SelectItem value="توكيلات">توكيلات</SelectItem>
                <SelectItem value="مذكرات">مذكرات</SelectItem>
                <SelectItem value="دعاوى">دعاوى</SelectItem>
                <SelectItem value="أحكام">أحكام</SelectItem>
                <SelectItem value="أخرى">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_type">نوع القالب</Label>
            <Select
              value={formData.template_type}
              onValueChange={(value) =>
                setFormData({ ...formData, template_type: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="نص">نص</SelectItem>
                <SelectItem value="نموذج">نموذج</SelectItem>
                <SelectItem value="مستند رسمي">مستند رسمي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
