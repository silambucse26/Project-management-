import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, badge, children }: Props) {
  return (
    <div className="app-shell relative flex min-h-screen w-full overflow-x-hidden bg-transparent text-white before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_48%_18%,rgba(91,92,255,0.30),transparent_34%),radial-gradient(circle_at_78%_54%,rgba(187,47,255,0.20),transparent_32%),radial-gradient(circle_at_93%_88%,rgba(255,43,155,0.20),transparent_25%)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-transparent">
        <TopHeader title={title} subtitle={subtitle} badge={badge} />
        <main className="dashboard-main flex-1 space-y-7 bg-transparent p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}
