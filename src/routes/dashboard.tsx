import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FolderKanban, ListChecks, AlertTriangle, Users, UserCheck, Clock, ShieldCheck, ExternalLink, CalendarDays, CheckCircle2, ArrowRight, CircleAlert } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const COLORS = ["var(--primary)", "var(--warning)", "var(--destructive)", "var(--success)"];
const PIE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function statusToTone(status: string) {
  return status === "on-track" ? "text-success" : "text-warning";
}

function Dashboard() {
  const { role, tasks, approvals, visibleUsers, activities, currentUser, visibleProjects } = useApp();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "approved");
  const completedTasks = tasks.filter((task) => task.status === "completed" || task.status === "approved");
  const departments = Array.from(new Set(tasks.map((task) => task.department))).filter(Boolean);
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;

  const departmentProgress = departments.map((department) => {
    const deptTasks = tasks.filter((task) => task.department === department);
    const done = deptTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
    const blocked = deptTasks.filter((task) => task.status === "blocked").length;
    return {
      name: department,
      progress: deptTasks.length ? Math.round((done / deptTasks.length) * 100) : 0,
      status: blocked > 0 ? "at-risk" : "on-track",
    };
  });
  const tasksByDept = departments.map((department) => ({ dept: department.replace(" Production", ""), tasks: tasks.filter((task) => task.department === department).length }));
  const workloadData = tasksByDept.slice(0, 4).map((item) => ({ name: item.dept, value: item.tasks || 1 }));
  const statusData = [
    { name: "Backlog", value: tasks.filter((task) => task.status === "backlog").length },
    { name: "Active", value: tasks.filter((task) => task.status === "in-progress").length },
    { name: "Blocked", value: tasks.filter((task) => task.status === "blocked").length },
    { name: "Completed", value: completedTasks.length },
  ];
  const projectTrend = [
    { month: "Backlog", planned: tasks.length, completed: completedTasks.length },
    { month: "Active", planned: activeTasks.length, completed: completedTasks.length },
    { month: "Review", planned: tasks.filter((task) => task.status === "in-review").length, completed: completedTasks.length },
    { month: "Done", planned: completedTasks.length, completed: completedTasks.length },
  ];
  const upcomingDeadlines = activeTasks.slice(0, 4).map((task, index) => ({ id: task.id, title: task.title, days: index + 1, priority: task.priority }));
  const priorityCounts = ["critical", "high", "medium", "low"].map((priority) => ({
    label: priority[0].toUpperCase() + priority.slice(1),
    value: tasks.filter((task) => task.priority === priority).length,
    className: priority === "critical" ? "bg-destructive/10 text-destructive" : priority === "high" ? "bg-warning/15 text-warning" : priority === "medium" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground",
  }));
  const stats = [
    { label: "Total Projects", value: visibleProjects.length, icon: FolderKanban, tone: "primary" as const, to: "/projects" as const },
    { label: "Active Tasks", value: activeTasks.length, icon: ListChecks, tone: "info" as const, to: "/tasks" as const },
    { label: "Blocked Tasks", value: tasks.filter((task) => task.status === "blocked").length, icon: AlertTriangle, tone: "destructive" as const, to: "/tasks" as const },
    { label: "Dept Heads", value: visibleUsers.filter((user) => user.role === "head").length, icon: ShieldCheck, tone: "purple" as const, to: "/departments" as const },
    { label: "Team Members", value: visibleUsers.filter((user) => user.role === "member").length, icon: Users, tone: "success" as const, to: "/teams" as const },
    { label: "Pending Approvals", value: pendingApprovals, icon: UserCheck, tone: "warning" as const, to: "/approvals" as const },
  ];
  const teamActivity = visibleUsers.filter((user) => user.role === "member").map((user) => {
    const memberTasks = tasks.filter((task) => task.assigneeId === user.id || task.assignee === user.name || task.createdById === user.id);
    const done = memberTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
    const submitted = memberTasks.filter((task) => task.approvalStatus === "pending").length;
    const delayed = memberTasks.filter((task) => task.status === "blocked").length;
    const last = activities.find((activity) => activity.user === user.name);
    return { user, total: memberTasks.length, done, pending: memberTasks.length - done, delayed, submitted, last };
  });

if (role === "member") {
  const myTasks = tasks.filter(
    (task) =>
      task.assigneeId === currentUser.id ||
      task.assignee === currentUser.name
  );

  const myProjects = visibleProjects.filter((project) =>
    myTasks.some(
      (task) =>
        task.projectId === project.id ||
        task.projectName === project.name
    )
  );
  const myCompletedTasks = myTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
  const myBlockedTasks = myTasks.filter((task) => task.status === "blocked").length;
  const myReviewTasks = myTasks.filter((task) => task.status === "in-review").length;
  const memberStats = [
    { label: "My open tasks", value: myTasks.length - myCompletedTasks, icon: ListChecks, tone: "primary" as const, to: "/my-work" as const },
    { label: "Projects assigned", value: myProjects.length, icon: FolderKanban, tone: "info" as const, to: "/projects" as const },
    { label: "Waiting for review", value: myReviewTasks, icon: CalendarDays, tone: "purple" as const, to: "/my-work" as const },
    { label: "Needs attention", value: myBlockedTasks, icon: CircleAlert, tone: "destructive" as const, to: "/my-work" as const },
    { label: "Completed", value: myCompletedTasks, icon: CheckCircle2, tone: "success" as const, to: "/my-work" as const },
  ];
  const taskSummary = [
    { name: "In progress", value: myTasks.filter((task) => task.status === "in-progress").length, color: "#3867f4" },
    { name: "Pending review", value: myTasks.filter((task) => task.status === "in-review" || task.status === "changes").length, color: "#7454ef" },
    { name: "Completed", value: myCompletedTasks, color: "#55bd42" },
    { name: "Overdue", value: myBlockedTasks, color: "#ff9d19" },
  ];

  return (
    <AppLayout
      title={`Welcome back, ${currentUser.name}`}
      badge="Team Member"
      subtitle={`${currentUser.department} daily work`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {memberStats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="block transition-transform hover:-translate-y-0.5">
            <StatCard {...stat} />
          </Link>
        ))}
      </div>
     {/* Profile + Calendar */}
<Card className="overflow-hidden border-0 shadow-xl rounded-3xl h-[320px]">
  <div className="grid items-stretch gap-0 lg:grid-cols-[1.15fr_0.85fr]">
    {/* Profile Details */}
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-6 flex flex-col justify-between text-white">
      <div className="absolute -right-16 -top-16 size-44 rounded-full bg-white/10" />
      <div className="relative">
      <h2 className="mb-4 text-base font-semibold">
        My Profile
      </h2>

      <div className="grid grid-cols-[96px_14px_1fr] gap-y-2 text-xs sm:text-sm">
        <span className="font-medium text-white/75">
          Name
        </span>
        <span>:</span>
        <span className="font-medium">
          {currentUser.name}
        </span>

        <span className="font-medium text-white/75">
          Role
        </span>
        <span>:</span>
        <span>
          {currentUser.role}
        </span>

        <span className="font-medium text-white/75">
          Department
        </span>
        <span>:</span>
        <span>
          {currentUser.department}
        </span>

        <span className="font-medium text-white/75">
          Email
        </span>
        <span>:</span>
        <span>
          {currentUser.email}
        </span>
      </div>
      <Button variant="secondary" size="sm" className="mt-5 h-8 bg-white/15 px-3 text-xs text-white hover:bg-white/25" asChild>
        <Link to="/settings">View profile <ArrowRight className="size-4" /></Link>
      </Button>
      </div>
    </div>

    {/* Calendar */}
    <div className="p-5">
      <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">
        My Calendar
      </h3>
      <Badge variant="secondary">Today</Badge>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        defaultMonth={today}
       className="mx-auto rounded-xl bg-transparent p-0 [--cell-size:2rem]"
      />
    </div>
  </div>
</Card>

{/* Assigned Projects */}
<Card className="border-border/70 p-5 shadow-sm">
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="font-semibold">My Projects</h2>
    <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild><Link to="/projects">View all <ArrowRight className="size-4" /></Link></Button>
  </div>

  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {myProjects.map((project) => (
      <Link key={project.id} to="/projects/$id" params={{ id: project.id }} 
      className="
        group
        rounded-2xl
        bg-white
        border
        shadow-md
        hover:shadow-xl
        hover:-translate-y-1
        transition
        duration-300
        p-5
        ">
        <h3 className="font-medium">
          {project.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.department}
        </p>
        <div className="mt-4"><Progress value={project.progress} className="h-1.5" /></div>
      </Link>
    ))}
  </div>
</Card>

      {/* Assigned Tasks */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="overflow-hidden border-border/70 p-0 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <h2 className="font-semibold">My Assigned Tasks</h2>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild><Link to="/my-work">View all tasks <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-y bg-muted/35 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.slice(0, 5).map((task) => {
                  const progress = task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : task.status === "in-progress" ? 50 : 0);
                  const priorityClass = task.priority === "critical" || task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-warning/15 text-warning" : "bg-success/10 text-success";
                  return (
                    <tr key={task.id} className="border-b last:border-0 transition-colors hover:bg-primary/[0.025]">
                      <td className="max-w-48 truncate px-5 py-3.5 font-medium">{task.title}</td>
                      <td className="max-w-36 truncate px-3 py-3.5 text-muted-foreground">{task.projectName || "Unassigned"}</td>
                      <td className="px-3 py-3.5"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${priorityClass}`}>{task.priority}</span></td>
                      <td className="px-3 py-3.5"><StatusBadge status={task.status} /></td>
                      <td className="px-3 py-3.5"><div className="flex items-center gap-2"><span className="font-medium">{progress}%</span><Progress value={progress} className="h-1.5 w-16" /></div></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{task.due}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Task Summary</h3>
          <div className="mt-2 flex items-center gap-3">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={taskSummary} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                  {taskSummary.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="min-w-0 space-y-2 text-xs">
              {taskSummary.map((item) => <div key={item.name} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-semibold">{item.value}</span></div>)}
            </div>
          </div>
          <p className="-mt-2 text-center text-xs text-muted-foreground">{myTasks.length} total tasks</p>
        </Card>
      </div>
    </AppLayout>
  );
}

  return (
    <AppLayout title={role === "admin" ? "Admin Dashboard" : "Department Dashboard"} badge="Overview" subtitle={role === "admin" ? "All heads, members, and tasks" : `${currentUser.department} tasks and team`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="block transition-transform hover:-translate-y-0.5">
            <StatCard label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="border-border/70 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Task Progress Overview</h3>
            <span className="text-xs text-muted-foreground">By department</span>
          </div>
          <div className="space-y-3.5">
            {departmentProgress.map((department) => (
              <div key={department.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{department.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{department.progress}%</span>
                    <span className={`text-xs ${statusToTone(department.status)}`}>{department.status === "on-track" ? "On Track" : "At Risk"}</span>
                  </span>
                </div>
                <Progress value={department.progress} />
              </div>
            ))}
          </div>
        </Card>

            <Card className="p-5">
        <h3 className="font-semibold mb-3">Calendar</h3>

        <Calendar
          mode="single"
          className="rounded-md border w-full"
        />
      </Card>

      <Card className="border-border/70 p-5 shadow-sm">
        <h3 className="font-semibold mb-1">Access Scope</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {role === "admin"
            ? "Admin can control all heads and members."
            : "Head can control own department members."}
        </p>

        <div className="space-y-3">
          {visibleUsers.slice(0, 5).map((user) => (
            <div key={user.id} className="rounded-lg p-3 bg-muted/50">
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {user.title} - {user.department}
              </div>
            </div>
          ))}
        </div>
      </Card>
      </div>
      <Card className="border-border/70 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Project & Task Details</h3>
            <p className="text-xs text-muted-foreground">{role === "admin" ? "All project task registers" : `${currentUser.department} project task registers`}</p>
          </div>
          <Badge variant="outline">{visibleProjects.length} projects</Badge>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleProjects.slice(0, 6).map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id || task.projectName === project.name);
            const done = projectTasks.filter((task) => task.status === "completed").length;
            const pending = projectTasks.length - done;
            const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : project.progress;
            return (
              <Link key={project.id} to="/projects/$id" params={{ id: project.id }} className="rounded-lg border p-3 block hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    <div className="text-xs text-muted-foreground">{project.department} - {project.owner}</div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <span><ExternalLink className="size-3.5" /></span>
                  </Button>
                </div>
                <div className="mt-3"><Progress value={progress} className="h-1.5" /></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="text-muted-foreground">Tasks</div><div className="font-semibold">{projectTasks.length}</div></div>
                  <div><div className="text-muted-foreground">Done</div><div className="font-semibold text-success">{done}</div></div>
                  <div><div className="text-muted-foreground">Pending</div><div className="font-semibold text-warning">{pending}</div></div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {role === "head" && (
      <Card className="border-border/70 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold">Team Member Activity</h3>
              <p className="text-xs text-muted-foreground">Live task and review summary for {currentUser.department}</p>
            </div>
            <Badge variant="outline">{teamActivity.length} members</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/50">
                <tr>
                  <th className="text-left p-3">Member</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Completed</th>
                  <th className="text-left p-3">Pending</th>
                  <th className="text-left p-3">Delayed</th>
                  <th className="text-left p-3">Submitted</th>
                  <th className="text-left p-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {teamActivity.map((item) => (
                  <tr key={item.user.id} className="border-t">
                    <td className="p-3 font-medium">{item.user.name}</td>
                    <td className="p-3">{item.total}</td>
                    <td className="p-3 text-success">{item.done}</td>
                    <td className="p-3 text-warning">{item.pending}</td>
                    <td className="p-3 text-destructive">{item.delayed}</td>
                    <td className="p-3">{item.submitted}</td>
                    <td className="p-3 text-muted-foreground">{item.last ? `${item.last.action} (${item.last.time})` : "No team activity yet"}</td>
                  </tr>
                ))}
                {!teamActivity.length && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No team activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={projectTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="planned" stroke="var(--info)" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Tasks by Department</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tasksByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dept" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="tasks" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={workloadData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {workloadData.map((_, index) => <Cell key={index} fill={PIE[index % PIE.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80}>
                {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent Activities</h3>
          <div className="space-y-3">
            {activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="size-8 shrink-0"><AvatarFallback className="text-xs bg-muted">{activity.user.split(" ").map((part) => part[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-sm"><span className="font-medium">{activity.user}</span> <span className="text-muted-foreground">{activity.action}</span></div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="size-3" />{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{deadline.title}</div>
                  <div className="text-xs text-muted-foreground">Due in {deadline.days} days</div>
                </div>
                <Badge variant="outline" className={deadline.priority === "high" || deadline.priority === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" : deadline.priority === "medium" ? "bg-warning/15 text-warning border-warning/20" : "bg-muted"}>{deadline.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Task Priority Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {priorityCounts.map((item) => (
              <div key={item.label} className={`rounded-lg p-3 ${item.className}`}>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs opacity-80">{item.label}</div>
              </div>
            ))}
          </div>
          <h4 className="font-semibold text-sm mt-5 mb-2">Approval Queue</h4>
          <ul className="space-y-1.5 text-sm">
            {approvals.filter((approval) => approval.status === "pending").slice(0, 5).map((approval) => (
              <li key={approval.id} className="flex items-center justify-between"><span className="truncate">{approval.type}</span><StatusBadge status="pending" /></li>
            ))}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
