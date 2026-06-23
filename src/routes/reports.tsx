import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/common/StatCard";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ComposedChart, Area,
} from "recharts";
import { Download, FileText, Loader2, FolderKanban, ListChecks, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const PIE = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)"];

function workloadColor(w: string) {
  return w === "Overloaded" ? "bg-destructive/15 text-destructive" : w === "Underloaded" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
}

function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const { tasks, users, visibleUsers, visibleProjects, approvals } = useApp();
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "approved");
  const completedTasks = tasks.filter((task) => task.status === "completed" || task.status === "approved");
  const blockedTasks = tasks.filter((task) => task.status === "blocked");
  const departments = Array.from(new Set(tasks.map((task) => task.department))).filter(Boolean);
  const onTime = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const projectTrend = [
    { month: "Backlog", planned: tasks.length, completed: completedTasks.length },
    { month: "Active", planned: activeTasks.length, completed: completedTasks.length },
    { month: "Review", planned: tasks.filter((task) => task.status === "in-review").length, completed: completedTasks.length },
    { month: "Done", planned: completedTasks.length, completed: completedTasks.length },
  ];
  const productivityData = departments.map((department) => {
    const deptTasks = tasks.filter((task) => task.department === department);
    const completed = deptTasks.filter((task) => task.status === "completed").length;
    return { dept: department.replace(" Production", ""), value: deptTasks.length ? Math.round((completed / deptTasks.length) * 100) : 0 };
  });
  const overdueData = departments.map((department) => ({ team: department.replace(" Production", ""), count: tasks.filter((task) => task.department === department && task.status === "blocked").length }));
  const workloadBalance = [
    { name: "Optimal", value: activeTasks.length },
    { name: "Overloaded", value: blockedTasks.length },
    { name: "Completed", value: completedTasks.length },
  ];
  const status = [
    { name: "Completed", value: completedTasks.length },
    { name: "In Progress", value: tasks.filter((task) => task.status === "in-progress").length },
    { name: "Pending", value: tasks.filter((task) => task.status === "backlog" || task.status === "in-review").length },
    { name: "Blocked", value: blockedTasks.length },
  ];
  const monthly = [
    { m: "Assigned", assigned: tasks.length, completed: completedTasks.length },
    { m: "Active", assigned: activeTasks.length, completed: completedTasks.length },
    { m: "Done", assigned: completedTasks.length, completed: completedTasks.length },
  ];
  const approvalTime = [
    { week: "Pending", hrs: approvals.filter((approval) => approval.status === "pending").length },
    { week: "Approved", hrs: approvals.filter((approval) => approval.status === "approved").length },
    { week: "Rejected", hrs: approvals.filter((approval) => approval.status === "rejected").length },
    { week: "Changes", hrs: approvals.filter((approval) => approval.status === "changes").length },
  ];
  const reportSnapshot = departments.map((department) => {
    const deptTasks = tasks.filter((task) => task.department === department);
    const completed = deptTasks.filter((task) => task.status === "completed").length;
    const overdue = deptTasks.filter((task) => task.status === "blocked").length;
    const deptOnTime = deptTasks.length ? Math.round((completed / deptTasks.length) * 100) : 0;
    return {
      dept: department,
      projects: visibleProjects.filter((project) => project.department === department).length,
      assigned: deptTasks.length,
      completed,
      onTime: deptOnTime,
      overdue,
      approval: approvals.filter((approval) => approval.department === department && approval.status === "pending").length,
      workload: overdue > 2 ? "Overloaded" : activeTasks.length < completed ? "Underloaded" : "Optimal",
    };
  });
  const topDepartment = productivityData.slice().sort((a, b) => b.value - a.value)[0];
  const delayedDepartment = overdueData.slice().sort((a, b) => b.count - a.count)[0];

  function generate() {
    setLoading(true);
    setTimeout(()=>{ setLoading(false); toast.success("Report generated successfully"); }, 900);
  }

  return (
    <AppLayout title="Reports & Analytics" badge="Insights" subtitle="Performance, productivity, and trends">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="may"><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="may">May 2025</SelectItem><SelectItem value="apr">Apr 2025</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Departments</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Project Types</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Roles</SelectItem></SelectContent></Select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={()=>toast.success("Report exported successfully")}><Download className="size-4" />Export</Button>
            <Button size="sm" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Admin Overview</h3><Badge>System</Badge></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Users</div><div className="text-xl font-bold">{users.length}</div></div>
            <div><div className="text-muted-foreground text-xs">Tasks</div><div className="text-xl font-bold">{tasks.length}</div></div>
            <div><div className="text-muted-foreground text-xs">Complete</div><div className="text-xl font-bold text-success">{onTime}%</div></div>
            <div><div className="text-muted-foreground text-xs">Blocked</div><div className="text-xl font-bold text-destructive">{blockedTasks.length}</div></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Department Heads</h3><Badge variant="secondary">Heads</Badge></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Heads</div><div className="text-xl font-bold">{visibleUsers.filter((user) => user.role === "head").length}</div></div>
            <div><div className="text-muted-foreground text-xs">Tasks</div><div className="text-xl font-bold">{activeTasks.length}</div></div>
            <div><div className="text-muted-foreground text-xs">Complete</div><div className="text-xl font-bold text-success">{onTime}%</div></div>
            <div><div className="text-muted-foreground text-xs">Blocked</div><div className="text-xl font-bold text-destructive">{blockedTasks.length}</div></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Team Members</h3><Badge variant="outline">Members</Badge></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Tasks Done</div><div className="text-xl font-bold">{completedTasks.length}</div></div>
            <div><div className="text-muted-foreground text-xs">Complete</div><div className="text-xl font-bold text-success">{onTime}%</div></div>
            <div><div className="text-muted-foreground text-xs">Members</div><div className="text-xl font-bold">{visibleUsers.filter((user) => user.role === "member").length}</div></div>
            <div><div className="text-muted-foreground text-xs">Blocked</div><div className="text-xl font-bold text-destructive">{blockedTasks.length}</div></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Departments" value={departments.length} icon={FolderKanban} tone="primary" />
        <StatCard label="Total Tasks" value={tasks.length} icon={ListChecks} tone="info" />
        <StatCard label="Completion" value={`${onTime}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Blocked" value={blockedTasks.length} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5"><h3 className="font-semibold mb-4">Project Completion Trend</h3>
          <ResponsiveContainer width="100%" height={220}><LineChart data={projectTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
            <Line type="monotone" dataKey="planned" stroke="var(--info)" strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={2} />
          </LineChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-4">Department Productivity</h3>
          <ResponsiveContainer width="100%" height={220}><BarChart data={productivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dept" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
            <Bar dataKey="value" fill="var(--success)" radius={[6,6,0,0]} />
          </BarChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-4">Overdue Tasks by Team</h3>
          <ResponsiveContainer width="100%" height={220}><BarChart data={overdueData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="team" fontSize={11} stroke="var(--muted-foreground)" width={70} />
            <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
            <Bar dataKey="count" fill="var(--destructive)" radius={[0,6,6,0]} />
          </BarChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-4">Approval Turnaround (hrs)</h3>
          <ResponsiveContainer width="100%" height={220}><LineChart data={approvalTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
            <Line type="monotone" dataKey="hrs" stroke="var(--warning)" strokeWidth={2} />
          </LineChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-4">Workload Balance</h3>
          <ResponsiveContainer width="100%" height={220}><PieChart>
            <Pie data={workloadBalance} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {workloadBalance.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-4">Task Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}><PieChart>
            <Pie data={status} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {status.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5"><h3 className="font-semibold mb-4">Monthly Output Summary</h3>
        <ResponsiveContainer width="100%" height={260}><ComposedChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="m" fontSize={11} stroke="var(--muted-foreground)" />
          <YAxis fontSize={11} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }} />
          <Legend />
          <Bar dataKey="assigned" fill="var(--primary)" radius={[6,6,0,0]} />
          <Area dataKey="completed" fill="var(--success)" stroke="var(--success)" fillOpacity={0.3} />
        </ComposedChart></ResponsiveContainer>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-primary/5 to-purple/5">
        <h3 className="font-semibold mb-2">AI Insights Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-card border">
            <div className="text-xs text-muted-foreground">Top Performing</div>
            <div className="font-semibold">{topDepartment ? `${topDepartment.dept} - ${topDepartment.value}% complete` : "No department data yet"}</div>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <div className="text-xs text-muted-foreground">Delayed Department</div>
            <div className="font-semibold text-destructive">{delayedDepartment && delayedDepartment.count > 0 ? `${delayedDepartment.team} - ${delayedDepartment.count} blocked tasks` : "No blocked tasks"}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Recommended focus: </span>
          {blockedTasks.length > 0 ? "Review blocked tasks and pending approvals from the live queues." : "Keep task approvals current and continue balancing active work from the live queues."}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b"><h3 className="font-semibold">Analytics Snapshot</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Projects</th>
                <th className="text-left p-3">Assigned</th>
                <th className="text-left p-3">Completed</th>
                <th className="text-left p-3">On-Time</th>
                <th className="text-left p-3">Overdue</th>
                <th className="text-left p-3">Pending Approval</th>
                <th className="text-left p-3">Workload</th>
              </tr>
            </thead>
            <tbody>
              {reportSnapshot.map(r => (
                <tr key={r.dept} className="border-t">
                  <td className="p-3 font-medium">{r.dept}</td>
                  <td className="p-3">{r.projects}</td>
                  <td className="p-3">{r.assigned}</td>
                  <td className="p-3">{r.completed}</td>
                  <td className="p-3"><span className={r.onTime>=80?"text-success":r.onTime>=70?"text-info":"text-warning"}>{r.onTime}%</span></td>
                  <td className="p-3 text-destructive">{r.overdue}</td>
                  <td className="p-3">{r.approval}h</td>
                  <td className="p-3"><Badge variant="outline" className={workloadColor(r.workload)}>{r.workload}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}

