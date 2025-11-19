import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { AddTemplateDialog } from "@/components/AddTemplateDialog";
import { EditTemplateDialog } from "@/components/EditTemplateDialog";
import { TemplateEditorDialog } from "@/components/TemplateEditorDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  template_type: string;
  content: any;
  is_default: boolean;
  created_at: string;
}

const Templates = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const q = query(
        collection(db, "templates"),
        where('user_id', '==', user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Template[];
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("فشل في تحميل القوالب");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleOpenEditor = (template: Template) => {
    setSelectedTemplate(template);
    setEditorDialogOpen(true);
  };

  const handleDeleteClick = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteDoc(doc(db, "templates", selectedTemplate.id));
      toast.success("تم حذف القالب بنجاح");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("فشل في حذف القالب");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <AddTemplateDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onTemplateAdded={fetchTemplates}
      />

      {selectedTemplate && (
        <>
          <EditTemplateDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            template={selectedTemplate}
            onTemplateUpdated={fetchTemplates}
          />

          <TemplateEditorDialog
            open={editorDialogOpen}
            onOpenChange={setEditorDialogOpen}
            template={selectedTemplate}
            onTemplateSaved={fetchTemplates}
          />
        </>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="حذف القالب"
        description="هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء."
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('templates')}</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          {t('addDocument')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {searchQuery ? "لا توجد قوالب تطابق البحث" : "لا توجد قوالب بعد"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  {template.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      افتراضي
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl">{template.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex gap-2 text-xs">
                  <span className="bg-secondary px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span className="bg-secondary px-2 py-1 rounded">
                    {template.template_type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenEditor(template)}
                  >
                    <Edit className="ml-2 h-4 w-4" />
                    تحرير
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(template)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;
