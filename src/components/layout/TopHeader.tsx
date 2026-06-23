import { Bell, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function TopHeader({ title, subtitle, badge }: Props) {
  const { role, currentUser, logout, unreadNotifications, notifications, markNotificationRead } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
            {badge && <Badge variant="secondary" className="hidden sm:inline-flex">{badge}</Badge>}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>

        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search projects, tasks, teams, users..." className="pl-9 h-9 bg-muted/40 border-transparent" />
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
          <Calendar className="size-3.5" /> Live workspace data
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative size-9 grid place-items-center rounded-md hover:bg-muted">
            <Bell className="size-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground grid place-items-center">
                {unreadNotifications.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 8).map((notification) => (
              <DropdownMenuItem key={notification.id} onClick={() => markNotificationRead(notification.id)} className="items-start gap-2">
                <div className={`mt-1 size-2 rounded-full ${notification.read ? "bg-muted" : "bg-primary"}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{notification.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-normal">{notification.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{notification.time}</div>
                </div>
              </DropdownMenuItem>
            ))}
            {!notifications.length && <DropdownMenuItem disabled>No notifications yet</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 hover:bg-muted rounded-lg p-1 pr-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{currentUser.initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-muted-foreground">{roleLabel[role]} - {currentUser.department}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div>{currentUser.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{currentUser.title} - {currentUser.department}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
