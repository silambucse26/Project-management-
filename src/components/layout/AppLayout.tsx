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
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader title={title} subtitle={subtitle} badge={badge} />
        <main className="flex-1 p-4 md:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
