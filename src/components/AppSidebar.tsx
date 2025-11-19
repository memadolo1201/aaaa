import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  Receipt,
  BarChart3,
  Settings,
  Scale,
  FileCode,
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    { title: t('dashboard'), url: "/", icon: LayoutDashboard },
    { title: t('clients'), url: "/clients", icon: Users },
    { title: t('cases'), url: "/cases", icon: Briefcase },
    { title: t('documents'), url: "/documents", icon: FileText },
    { title: t('templates'), url: "/templates", icon: FileCode },
    { title: t('calendar'), url: "/calendar", icon: Calendar },
    { title: t('invoices'), url: "/invoices", icon: Receipt },
    { title: t('reports'), url: "/reports", icon: BarChart3 },
    { title: t('settings'), url: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t('logout'));
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("فشل تسجيل الخروج");
    }
  };

  return (
    <Sidebar className="border-l border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-background/95 shadow-2xl">
      <SidebarHeader className="p-8 border-b border-sidebar-border/50 bg-sidebar-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center shadow-[0_8px_32px_-8px_hsl(var(--accent)/0.6)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Scale className="w-8 h-8 text-primary-dark relative z-10 drop-shadow-sm" />
          </div>
          {open && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight mb-1 bg-gradient-to-l from-accent to-sidebar-foreground bg-clip-text">المحاماة الفاخرة</h2>
              <p className="text-xs text-sidebar-foreground/70 font-medium">
                {user?.displayName || "مستخدم"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] font-bold uppercase tracking-wider px-5 mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-l from-sidebar-border/50 to-transparent"></div>
            القائمة الرئيسية
            <div className="h-px flex-1 bg-gradient-to-r from-sidebar-border/50 to-transparent"></div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    className="group"
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 hover:bg-sidebar-accent/80 text-sidebar-foreground/90 hover:text-sidebar-accent-foreground hover:shadow-lg hover:scale-[1.02] hover:translate-x-1 relative overflow-hidden"
                      activeClassName="bg-gradient-to-l from-sidebar-accent to-sidebar-accent/90 text-sidebar-accent-foreground font-bold shadow-xl scale-[1.02] border-r-4 border-accent"
                    >
                      <div className="absolute inset-0 bg-gradient-to-l from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <item.icon className="w-5 h-5 relative z-10 drop-shadow-sm" />
                      {open && <span className="relative z-10 text-[15px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {open && <span>{t('logout')}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
