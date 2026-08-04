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
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.12] bg-[linear-gradient(180deg,rgba(9,15,55,0.94),rgba(14,17,62,0.88))] shadow-[18px_0_55px_rgba(5,8,38,0.24)] backdrop-blur-2xl lg:sticky lg:top-0 lg:flex">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white shadow-lg shadow-cyan-400/25">
          <Briefcase className="size-5" />
        </div>
        <div>
          <div className="font-bold leading-tight text-sidebar-foreground">Chimertech PM</div>
          <div className="text-[10px] text-muted-foreground">Enterprise Workspace</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
          return (
            <Link
              key={`${it.to}-${i}`}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-primary to-[#7972f4] text-primary-foreground shadow-md shadow-primary/20"
                  : "text-sidebar-foreground/80 hover:translate-x-1 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="rounded-2xl border border-white/[0.12] bg-[rgba(30,39,92,0.72)] p-3.5 shadow-[0_14px_40px_rgba(39,32,110,0.22)] backdrop-blur-xl">
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
