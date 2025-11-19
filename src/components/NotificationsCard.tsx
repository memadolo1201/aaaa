import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, DollarSign, AlertTriangle, Clock, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: "event" | "invoice" | "case";
  title: string;
  message: string;
  date: string;
  priority: "high" | "medium" | "low";
}

interface NotificationsCardProps {
  notifications: Notification[];
  loading?: boolean;
  onSnooze?: (notificationId: string, minutes: number) => void;
}

export const NotificationsCard = ({ notifications, loading, onSnooze }: NotificationsCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "invoice":
        return <DollarSign className="w-4 h-4" />;
      case "case":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-5 h-5 text-accent" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-5 h-5 text-accent" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">لا توجد إشعارات جديدة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bell className="w-5 h-5 text-accent" />
          الإشعارات
          {notifications.length > 0 && (
            <Badge variant="destructive" className="mr-auto">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${getPriorityColor(
                notification.priority
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                  <p className="text-xs opacity-90 mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      {notification.priority === "high" && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{notification.date}</span>
                    </div>
                    {onSnooze && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <Clock className="w-3 h-3 ml-1" />
                            تأجيل
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSnooze(notification.id, 15)}>
                            تذكيرني بعد 15 دقيقة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSnooze(notification.id, 60)}>
                            تذكيرني بعد ساعة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSnooze(notification.id, 1440)}>
                            تذكيرني بعد 24 ساعة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
