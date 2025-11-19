import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className = "" }: StatsCardProps) {
  return (
    <Card className={`luxury-card hover:scale-[1.02] ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <p className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
