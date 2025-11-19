import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { dir } = useLanguage();
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full bg-gradient-to-br from-background via-background to-secondary/10`} dir={dir}>
        <div className="flex-1 flex flex-col w-full">
          <header className="h-20 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 flex items-center px-8 gap-4 shadow-sm">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-l from-accent/10 to-accent/5 border border-accent/20 shadow-lg">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">المحاماة الفاخرة</p>
                <p className="text-[11px] text-muted-foreground font-medium">نظام الإدارة القانونية</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent via-accent-light to-accent-dark flex items-center justify-center text-primary-dark font-bold text-lg shadow-lg">
                م
              </div>
            </div>
            
            <div className="flex-1" />
            
            <SidebarTrigger className="hover:bg-accent/20 transition-all duration-300 rounded-xl p-2.5 hover:shadow-lg hover:scale-105">
              <Menu className="w-5 h-5 text-foreground" />
            </SidebarTrigger>
          </header>

          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
        
        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}
