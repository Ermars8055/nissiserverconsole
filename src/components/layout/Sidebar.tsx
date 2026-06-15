import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  HardDrive,
  Network,
  Database,
  Terminal as TerminalIcon,
  FileText,
  Users,
  Settings,
  BarChart
} from "lucide-react";

export function Sidebar() {
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Swarm Cluster", href: "/swarm", icon: Network },
    { name: "Images", href: "/images", icon: HardDrive },
    { name: "Networks", href: "/networks", icon: Network },
    { name: "Databases", href: "/databases", icon: Database },
    { name: "Storage Vault", href: "/storage", icon: Database },
    { name: "Printer Management", href: "/printers", icon: FileText },
    { name: "Terminal", href: "/terminal", icon: TerminalIcon },
    { name: "Logs", href: "/logs", icon: FileText },
    { name: "Users", href: "/users", icon: Users },
    { name: "Global Report", href: "/report", icon: BarChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card px-3 py-4">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ServerAdmin
        </h1>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
