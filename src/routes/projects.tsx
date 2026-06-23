import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Search, X, Flag, ExternalLink, Plus } from "lucide-react";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { departments, type Project } from "@/data/mockData";

export const Route = createFileRoute("/projects")({ component: ProjectsPage });

const COLORS = ["var(--success)","var(--warning)","var(--destructive)","var(--info)"];

function ProjectsPage() {
  const { visibleProjects: projects, tasks, addProject, currentUser, role } = useApp();
  const defaultDepartment = role === "admin" ? departments[0].name : currentUser.department;
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", department: defaultDepartment, due: "", priority: "medium" as Project["priority"], description: "" });

  function projectTasks(project: Project) {
    return tasks.filter((task) => task.projectId === project.id || task.projectName === project.name);
  }

  function projectPhase(project: Project) {
    const linkedTasks = projectTasks(project);
    if (linkedTasks.length === 0) return "pending";
    if (linkedTasks.every((task) => task.status === "completed" || task.status === "approved")) return "completed";
    if (linkedTasks.some((task) => task.status === "blocked")) return "blocked";
    if (linkedTasks.some((task) => task.status === "in-progress" || task.status === "in-review")) return "in-progress";
    return "pending";
  }

  function projectProgress(project: Project) {
    const linkedTasks = projectTasks(project);
    if (!linkedTasks.length) return project.progress;
    return Math.round(linkedTasks.reduce((total, task) => total + (task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)), 0) / linkedTasks.length);
  }

  const filtered = useMemo(() => projects.filter(p =>
    (dept === "all" || p.department === dept) &&
    (status === "all" || p.status === status || projectPhase(p) === status) &&
    (priority === "all" || p.priority === priority) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.owner.toLowerCase().includes(q.toLowerCase()))
  ), [dept, status, priority, q, projects, tasks]);

  const depts = Array.from(new Set(projects.map(p => p.department)));
  const portfolio = [
    { name: "In Progress", value: projects.filter(p=>projectPhase(p)==="in-progress").length },
    { name: "Pending", value: projects.filter(p=>projectPhase(p)==="pending").length },
    { name: "Blocked", value: projects.filter(p=>projectPhase(p)==="blocked").length },
    { name: "Completed", value: projects.filter(p=>projectPhase(p)==="completed").length },
  ];

  function createProject() {
    if (!form.name.trim()) return toast.error("Project name is required");
    addProject({
      name: form.name,
      description: form.description,
      owner: currentUser.name,
      ownerId: currentUser.id,
      department: role === "admin" ? form.department : currentUser.department,
      due: form.due || "TBD",
      priority: form.priority,
    });
    setForm({ name: "", department: defaultDepartment, due: "", priority: "medium", description: "" });
    setOpen(false);
    toast.success("Project created");
  }

  return (
    <AppLayout title="Project Portfolio" badge="All Projects" subtitle="Cross-departmental project overview">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: "Total Projects", v: projects.length, c: "text-foreground" },
          { l: "In Progress", v: projects.filter(p=>projectPhase(p)==="in-progress").length, c: "text-primary" },
          { l: "Pending", v: projects.filter(p=>projectPhase(p)==="pending").length, c: "text-warning" },
          { l: "Blocked", v: projects.filter(p=>projectPhase(p)==="blocked").length, c: "text-destructive" },
          { l: "Completed", v: projects.filter(p=>projectPhase(p)==="completed").length, c: "text-info" },
        ].map(x => (
          <Card key={x.l} className="p-5">
            <div className="text-xs text-muted-foreground">{x.l}</div>
            <div className={`text-2xl font-bold mt-1 ${x.c}`}>{x.v}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Depts</SelectItem>{depts.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="blocked">Blocked</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={()=>{setDept("all");setStatus("all");setPriority("all");setQ("");}}><X className="size-4" />Clear</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4" />New Project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Project Name</Label><Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Project name" /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Short project detail" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Department</Label>
                    {role === "admin" ? (
                      <Select value={form.department} onValueChange={(value)=>setForm({...form, department: value})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{departments.map((department)=><SelectItem key={department.id} value={department.name}>{department.name}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input value={currentUser.department} readOnly />
                    )}
                  </div>
                  <div><Label>Due</Label><Input value={form.due} onChange={e=>setForm({...form, due: e.target.value})} placeholder="Today" /></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={createProject}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Portfolio Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={portfolio} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                {portfolio.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Project Timeline</h3>
          <div className="space-y-3">
            {projects.slice(0,5).map((p, i) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{p.name}</span><span className="text-muted-foreground">{p.due}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${projectProgress(p)}%`, marginLeft: `${i*3}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {filtered.map(p => {
          const linkedTasks = projectTasks(p);
          const done = linkedTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
          const doing = linkedTasks.filter((task) => task.status === "in-progress" || task.status === "in-review" || task.status === "blocked").length;
          const pendingTasks = linkedTasks.filter((task) => task.status === "backlog").length;
          const progress = projectProgress(p);
          return (
          <Link key={p.id} to="/projects/$id" params={{id: p.id}} className="block">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.department} · {p.owner}</div>
              </div>
              <StatusBadge status={projectPhase(p)} />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">Progress</span><span className="font-medium">{progress}%</span></div>
              <Progress value={progress} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div><div className="text-muted-foreground">Will Do</div><div className="font-semibold text-warning">{pendingTasks}</div></div>
              <div><div className="text-muted-foreground">Doing</div><div className="font-semibold text-primary">{doing}</div></div>
              <div><div className="text-muted-foreground">Done</div><div className="font-semibold text-success">{done}</div></div>
            </div>
            <div className="mt-4 rounded-lg border bg-muted/20 p-3">
              <div className="text-xs font-semibold mb-2">Task Details</div>
              <div className="space-y-2">
                {linkedTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="min-w-0 rounded-md bg-background/70 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium truncate">{task.title}</div>
                      <StatusBadge status={task.status === "in-review" ? "in-progress" : task.status} />
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate">Start {task.startDate ?? "Not set"}</span>
                      <span className="truncate">End {task.due}</span>
                      <span className="text-right font-medium text-foreground">{task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)}%</span>
                    </div>
                    {task.pendingReason && <div className="mt-1 text-[11px] text-warning truncate">Pending: {task.pendingReason}</div>}
                    {task.delayReason && <div className="mt-1 text-[11px] text-destructive truncate">Delay: {task.delayReason}</div>}
                  </div>
                ))}
                {!linkedTasks.length && <div className="text-xs text-muted-foreground">No task details added yet.</div>}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {Array.from({length: Math.min(p.teamSize,4)}).map((_,i)=>(
                  <Avatar key={i} className="size-7 border-2 border-card"><AvatarFallback className="bg-muted text-[10px]">{String.fromCharCode(65+i)}{String.fromCharCode(75+i)}</AvatarFallback></Avatar>
                ))}
                {p.teamSize > 4 && <div className="size-7 rounded-full bg-muted border-2 border-card grid place-items-center text-[10px] font-medium">+{p.teamSize-4}</div>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <PriorityBadge priority={p.priority} />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center pt-3 border-t">
              <div className="text-xs text-muted-foreground">Due {p.due}</div>
              <Button variant="ghost" size="sm" asChild><span>Details <ExternalLink className="size-3" /></span></Button>
            </div>
          </Card>
          </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent Updates</h3>
          <ul className="space-y-2.5 text-sm">
            {projects.slice(0,5).map(p => (
              <li key={p.id} className="flex items-center justify-between"><span className="truncate">{p.name}</span><StatusBadge status={projectPhase(p)} /></li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Flag className="size-4 text-destructive" />Flagged Projects</h3>
          <ul className="space-y-2.5 text-sm">
            {projects.filter(p=>projectPhase(p)==="blocked").map(p=>(
              <li key={p.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5"><span className="truncate">{p.name}</span><StatusBadge status="blocked" /></li>
            ))}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
