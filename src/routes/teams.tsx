import { createFileRoute, Link, Outlet, useRouterState, } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { departments } from "@/data/mockData";
import { TrendingUp, TrendingDown, Minus, Repeat, CalendarCheck, FileText } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
export const Route = createFileRoute("/teams")({ component: TeamsRoutePage });
function TeamsRoutePage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isDetailsPage =
    pathname.replace(/\/$/, "") !== "/teams";

  return isDetailsPage ? <Outlet /> : <TeamsPage />;
}
function workloadColor(w: number) {
  if (w >= 90) return "bg-destructive text-destructive-foreground";
  if (w >= 75) return "bg-warning text-warning-foreground";
  if (w >= 50) return "bg-primary text-primary-foreground";
  return "bg-success text-success-foreground";
}

function TeamsPage() {
  const { users, visibleUsers, currentUser, role, tasks, visibleProjects, activities } = useApp();
  const [filter, setFilter] = useState("all");
  const [leaveStatus, setLeaveStatus] = useState<"pending"|"approved"|"denied">("pending");
  const canManageTeam = role === "admin" || role === "head";
  const allowedDepartments = role === "admin" ? departments.map((d) => d.name) : [currentUser.department];
  const filtered = (filter === "all" ? departments : departments.filter(d => d.name === filter)).filter((department) => allowedDepartments.includes(department.name));
  const filterChips = ["all", ...allowedDepartments];
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "approved");
  const completedTasks = tasks.filter((task) => task.status === "completed" || task.status === "approved");
  const utilization = [
    { name: "Used", value: activeTasks.length },
    { name: "Free", value: Math.max(visibleUsers.filter((user) => user.role === "member").length * 5 - activeTasks.length, 0) },
  ];
  const skills = allowedDepartments.map((department) => {
    const deptTasks = tasks.filter((task) => task.department === department);
    const done = deptTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
    return { skill: department, value: deptTasks.length ? Math.round((done / deptTasks.length) * 100) : 0 };
  });

  return (
    <AppLayout title="Teams & Workload" badge="Org" subtitle="Manage capacity, workload, and team rosters">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map(c => (
            <button key={c} onClick={()=>setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter===c?"bg-primary text-primary-foreground":"bg-muted hover:bg-muted/70"}`}>
              {c === "all" ? "All Departments" : c}
            </button>
          ))}
        <div className="ml-auto text-xs text-muted-foreground">Only seeded admin and head accounts are available.</div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Head</th>
                <th className="text-left p-3">Members</th>
                <th className="text-left p-3">Workload</th>
                <th className="text-left p-3">Projects</th>
                <th className="text-left p-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const head = users.find(u => u.id === d.headId);
                const deptTasks = tasks.filter((task) => task.department === d.name);
                const deptActive = deptTasks.filter((task) => task.status !== "completed" && task.status !== "approved").length;
                const memberCount = users.filter((user) => user.department === d.name && user.role === "member").length;
                const workload = memberCount ? Math.min(100, Math.round((deptActive / (memberCount * 5)) * 100)) : 0;
                const projectCount = visibleProjects.filter((project) => project.department === d.name).length;
                return (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{d.name}</td>
                    <td className="p-3">{head?.name ?? "-"}</td>
                    <td className="p-3">{memberCount}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24"><Progress value={workload} /></div>
                        <Badge className={workloadColor(workload)}>{workload}%</Badge>
                      </div>
                    </td>
                    <td className="p-3">{projectCount}</td>
                    <td className="p-3">
                      {d.performance==="up"?<TrendingUp className="size-4 text-success" />:d.performance==="down"?<TrendingDown className="size-4 text-destructive" />:<Minus className="size-4 text-muted-foreground" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Team Utilization</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={utilization} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                <Cell fill="var(--primary)" /><Cell fill="var(--muted)" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Skill Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={skills} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="skill" fontSize={11} stroke="var(--muted-foreground)" width={80} />
              <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
     {canManageTeam && (
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Reassign panel opened")}>
            <Repeat className="size-4" />Reassign
          </Button>

          <Button variant="outline" size="sm" onClick={() => toast.success("Open Approvals to review leave requests")}>
            <CalendarCheck className="size-4" />Approve Leave
          </Button>

          <Button variant="outline" size="sm" onClick={() => toast.success("Reports opened")}>
            <FileText className="size-4" />View Reports
          </Button>
        </div>

        <div className="mt-5 pt-5 border-t">
          <h4 className="font-semibold text-sm mb-2">Pending Approval</h4>
          <div className="p-3 rounded-lg border">
            <div className="text-sm font-medium">Leave Requests</div>
            <div className="text-xs text-muted-foreground">
              Use Approvals for pending leave requests.
            </div>

            {leaveStatus === "pending" ? (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="flex-1" onClick={() => { setLeaveStatus("approved"); toast.success("Leave approved"); }}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setLeaveStatus("denied"); toast.error("Leave denied"); }}>
                  Deny
                </Button>
              </div>
            ) : (
              <Badge className="mt-2" variant="outline">{leaveStatus}</Badge>
            )}
          </div>
        </div>
      </Card>
)}
      </div>
<div>
  <h2 className="text-lg font-semibold mb-3">Team Roster</h2>

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {visibleUsers
      .filter((u) => u.role !== "admin")
      .map((u) => {
        const memberTasks = tasks.filter(
          (task) =>
            task.assigneeId === u.id ||
            task.assignee === u.name ||
            task.createdById === u.id
        );

        const done = memberTasks.filter(
          (task) =>
            task.status === "completed" || task.status === "approved"
        ).length;

        const pending = memberTasks.filter(
          (task) =>
            task.status !== "completed" && task.status !== "approved"
        ).length;

        const workload = Math.min(100, Math.round((pending / 5) * 100));
        const last = activities.find((activity) => activity.user === u.name);

        return (
          <Card key={u.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {u.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                {(role === "admin" || role === "head") && u.role === "member" ? (
                  <Link
                    to="/teams/$id"
                    params={{ id: u.id }}
                    className="font-medium text-sm truncate hover:text-primary hover:underline"
                  >
                    {u.name}
                  </Link>
                ) : (
                  <div className="font-medium text-sm truncate">
                    {u.name}
                  </div>
                )}

                {canManageTeam && (
                  <div className="text-xs text-muted-foreground truncate">
                    {u.title} - {u.department}
                  </div>
                )}
              </div>
            </div>

            {canManageTeam && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Tasks</div>
                    <div className="font-semibold">{memberTasks.length}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Done</div>
                    <div className="font-semibold text-success">{done}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Pending</div>
                    <div className="font-semibold text-warning">{pending}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Workload</span>
                    <span>{workload}%</span>
                  </div>

                  <Progress value={workload} className="h-1.5" />
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground truncate">
                  Last activity:{" "}
                  {last
                    ? `${last.action} (${last.time})`
                    : "No team activity yet"}
                </div>
              </>
            )}
          </Card>
        );
      })}
  </div>
</div>
    </AppLayout>
  );
}
