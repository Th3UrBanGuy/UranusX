
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from '@/components/dashboard/clock';
import { CalendarCard } from '@/components/dashboard/calendar-card';
import { AccountCard } from '@/components/dashboard/account-card';

interface AdminDashboardProps {
  onEditProfile: () => void;
  onLogout: () => void;
}

export function AdminDashboard({ onEditProfile, onLogout }: AdminDashboardProps) {

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Clock />
        </div>
        <div className="lg:col-span-1">
            <CalendarCard />
        </div>
      </div>
    </div>
  );
}
