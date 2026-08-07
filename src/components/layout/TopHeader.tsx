import { useState } from "react";
import { Bell, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/app-store";
import type { Role } from "@/data/mockData";

const roleLabel: Record<Role, string> = {
  admin: "Admin - Full control",
  head: "Department Head",
  member: "Team Member",
};

function notificationDate(id: string, time: string) {
  const parsedTime = new Date(time);
  if (!Number.isNaN(parsedTime.getTime())) return parsedTime;
  const idTimestamp = Number(id.startsWith("n-") ? id.slice(2) : NaN);
  return Number.isFinite(idTimestamp) ? new Date(idTimestamp) : null;
}

function formatNotificationTime(id: string, time: string) {
  const date = notificationDate(id, time);
  if (!date) return time;
  const today = new Date();
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function TopHeader({ title, subtitle, badge }: Props) {
  const {
    role,
    currentUser,
    logout,
    unreadNotifications,
    notifications,
    markNotificationRead,
    users,
    visibleUsers,
    projects,
    visibleProjects,
  } = useApp();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const searchableProjects = visibleProjects.length ? visibleProjects : projects;
  const searchableUsers = visibleUsers.length ? visibleUsers : users;

  const handleSearch = () => {
    const query = searchQuery.trim();

    if (!query) return;

    const normalizedQuery = query.toLowerCase();

    const projectMatch = searchableProjects.find(
      (project) =>
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.owner.toLowerCase().includes(normalizedQuery),
    );

    if (projectMatch) {
      navigate({
        to: "/projects/$id",
        params: { id: projectMatch.id },
      });
      return;
    }

    const userMatch = searchableUsers.find(
      (user) =>
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.title.toLowerCase().includes(normalizedQuery),
    );

    if (userMatch) {
      navigate({
        to: "/teams/$id",
        params: { id: userMatch.id },
      });
      return;
    }

    navigate({
      to: "/search",
      search: {
        q: query,
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.10] bg-transparent shadow-[0_12px_40px_rgba(14,16,65,0.08)] backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">
              {title}
            </h1>

            {badge && (
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex"
              >
                {badge}
              </Badge>
            )}
          </div>

          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Search form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative hidden w-[min(34vw,420px)] md:flex"
          role="search"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4
              -translate-y-1/2 text-muted-foreground"
          />

          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search projects, tasks, teams, users..."
            aria-label="Search workspace"
            className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 pr-10 text-xs shadow-inner shadow-black/10 transition placeholder:text-slate-400 focus:border-violet-400/50"
          />

          <button
            type="submit"
            aria-label="Submit search"
            disabled={!searchQuery.trim()}
            className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2
              place-items-center rounded-md text-muted-foreground
              hover:bg-muted hover:text-foreground
              disabled:pointer-events-none disabled:opacity-40"
          >
            <Search className="size-4" />
          </button>
        </form>


        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative grid size-9 place-items-center rounded-xl hover:bg-muted"
            aria-label="Open notifications"
          >
            <Bell className="size-4" />

            {unreadNotifications.length > 0 && (
              <span
                className="absolute -right-1 -top-1 grid h-5 min-w-5
                  place-items-center rounded-full bg-destructive px-1
                  text-[10px] font-semibold text-destructive-foreground"
              >
                {unreadNotifications.length}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notifications.slice(0, 8).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className="items-start gap-2"
              >
                <div
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    notification.read ? "bg-muted" : "bg-primary"
                  }`}
                />

                <div className="min-w-0">
                  <div className="text-xs font-semibold">
                    {notification.title}
                  </div>

                  <div className="whitespace-normal text-xs text-muted-foreground">
                    {notification.body}
                  </div>

                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatNotificationTime(notification.id, notification.time)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            {!notifications.length && (
              <DropdownMenuItem disabled>
                No notifications yet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button type="button" aria-label="Toggle theme" className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-amber-300 transition hover:border-violet-400/40 hover:bg-violet-500/15 hover:rotate-12">
          <Sun className="size-4" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-muted">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold leading-tight">
                {currentUser.name}
              </div>

              <div className="text-[10px] text-muted-foreground">
                {roleLabel[role]} - {currentUser.department}
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div>{currentUser.name}</div>

              <div className="text-xs font-normal text-muted-foreground">
                {currentUser.title} - {currentUser.department}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => navigate({ to: "/settings" })}
            >
              Profile Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={logout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
