import { useState, useEffect } from "react";
import { Menu, Search, Bell, LogOut, User, AlertTriangle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { logout, user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Poll for alerts every 10 seconds
    const fetchAlerts = async () => {
      try {
        const data = await fetchApi("/api/audit/?limit=20");
        // Filter for ERROR or WARN level logs
        const critical = data.filter((log: any) => log.action.includes("Error") || log.action.includes("Failed") || log.action.includes("Emergency"));
        setAlerts(critical.slice(0, 5));
      } catch (e) {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6 z-50">
      <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search resources..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors outline-none">
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold border border-card shadow-sm">
                  {alerts.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Recent Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No recent alerts.</div>
            ) : (
              alerts.map(alert => (
                <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                  <div className="flex items-center gap-2 font-medium">
                    {alert.action.includes("Error") ? <AlertCircle className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    <span className="truncate w-[230px]">{alert.action}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between w-full">
                    <span className="truncate">{alert.target || alert.user_email}</span>
                    <span className="shrink-0">{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {alerts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer" onClick={() => window.location.href='/logs'}>
                  View All Logs
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 border-l pl-4 ml-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium hidden md:block">{user?.email || 'Admin'}</span>
          <Button variant="ghost" size="icon" onClick={logout} title="Log out" className="ml-1 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
