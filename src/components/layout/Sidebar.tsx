import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, FolderKanban, ListChecks, Users, CheckCircle2,
  FileText, BarChart3, Settings, MessageSquare, HelpCircle, Briefcase, ShieldCheck,
} from "lucide-react";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

const adminNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/reports", label: "Analytics", icon: BarChart3 },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/help-center", label: "Help Center", icon: HelpCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const memberNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-work", label: "My Tasks", icon: ListChecks },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/help-center", label: "Help Center", icon: HelpCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const headNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/help-center", label: "Help Center", icon: HelpCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { role } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items =
  role === "admin"
    ? adminNav
    : role === "head"
    ? headNav
    : memberNav;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-5 border-b">
        <div className="size-9 rounded-lg bg-primary grid place-items-center text-primary-foreground">
          <Briefcase className="size-5" />
        </div>
        <div>
          <div className="font-bold text-sidebar-foreground leading-tight">Chimertech PM</div>
          <div className="text-[10px] text-muted-foreground">Enterprise Workspace</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it, i) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
          return (
            <Link
              key={`${it.to}-${i}`}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="size-3.5 text-primary" /> Role-Based Control
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
            Access and actions are determined by your role.
          </p>
          <div className="mt-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between"><span className="font-medium">Admin</span><span className="text-muted-foreground">Full Control</span></div>
            <div className="flex items-center justify-between"><span className="font-medium">Dept Head</span><span className="text-muted-foreground">Dept Control</span></div>
            <div className="flex items-center justify-between"><span className="font-medium">Member</span><span className="text-muted-foreground">Task Exec</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
