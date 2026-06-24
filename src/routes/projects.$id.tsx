import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PriorityBadge, StatusBadge } from "@/components/common/StatusBadge";
import { useApp } from "@/lib/app-store";
import { CheckCircle2, Circle, Clock, FileText, Plus, Send, AlertTriangle, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$id")({ component: ProjectDetailPage });

function parseDueDate(value: string) {
  if (!value || value === "TBD") return null;
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const withCurrentYear = new Date(`${value}, ${new Date().getFullYear()}`);
  return Number.isNaN(withCurrentYear.getTime()) ? null : withCurrentYear;
}

function isDelayedTask(task: { due: string; status: string }) {
  if (task.status === "completed" || task.status === "approved") return false;
  const dueDate = parseDueDate(task.due);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const { projects, allTasks, updateTaskStatus, comments, addComment, risks, addRisk, visibleUsers, users, currentUser, role } = useApp();
  const project = projects.find((item) => item.id === id);
  const [newComment, setNewComment] = useState("");
  const [newRisk, setNewRisk] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  if (!project) {
    return (
      <AppLayout title="Project not found" badge="Project" subtitle="Create the project first">
        <Card className="p-8 text-center">
          <h2 className="font-semibold">This project is not available.</h2>
          <Button className="mt-4" asChild><Link to="/projects">Back to Projects</Link></Button>
        </Card>
      </AppLayout>
    );
  }

  const allProjectTasks = allTasks.filter((task) => task.projectId === project.id || task.projectName === project.name);
  const viewerProjectTasks = role === "member"
    ? allProjectTasks.filter((task) => task.assigneeId === currentUser.id || task.assignee === currentUser.name)
    : allProjectTasks;
  const projectTasks = role !== "member" && selectedMemberId !== "all"
    ? viewerProjectTasks.filter((task) => task.assigneeId === selectedMemberId)
    : viewerProjectTasks;
  const willDoTasks = projectTasks.filter((task) => task.status === "backlog");
  const doingTasks = projectTasks.filter((task) => task.status === "in-progress" || task.status === "in-review" || task.status === "blocked");
  const doneTasks = projectTasks.filter((task) => task.status === "completed" || task.status === "approved");
  const completedCount = projectTasks.filter((task) => task.status === "completed" || task.status === "approved").length;
  const inProgressCount = projectTasks.filter((task) => task.status === "in-progress").length;
  const progress = projectTasks.length
    ? Math.round(projectTasks.reduce((total, task) => total + (task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)), 0) / projectTasks.length)
    : project.progress;
  const team = users.filter((user) => user.department === project.department && user.role !== "admin");
  const involvedTeam = team.filter((user) => allProjectTasks.some((task) => task.assigneeId === user.id || task.assignee === user.name));

  const memberTaskGroups = Array.from(
    viewerProjectTasks.reduce((groups, task) => {
      const key = task.assigneeId ?? task.assignee;
      const existing = groups.get(key);
      if (existing) {
        existing.tasks.push(task);
        return groups;
      }
      const user = users.find((item) => item.id === task.assigneeId || item.name === task.assignee);
      groups.set(key, {
        id: key,
        name: user?.name ?? task.assignee,
        title: user?.title ?? "Project Member",
        initials: user?.initials ?? task.assignee.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
        tasks: [task],
      });
      return groups;
    }, new Map<string, { id: string; name: string; title: string; initials: string; tasks: typeof viewerProjectTasks }>())
  ).map(([, value]) => value);
  const projectMemberSummaries = memberTaskGroups.length
    ? memberTaskGroups
    : (involvedTeam.length ? involvedTeam : team).map((member) => ({
      id: member.id,
      name: member.name,
      title: member.title,
      initials: member.initials,
      tasks: [] as typeof viewerProjectTasks,
    }));

  const creatorName = (id?: string) => users.find((user) => user.id === id)?.name ?? "Workspace";
  const projectHead = users.find((user) => user.id === project.ownerId) ?? users.find((user) => user.name === project.owner);
  const taskTimeline = allProjectTasks.slice(0, 8);
  const projectActivity = allProjectTasks
    .flatMap((task) => [
      task.registeredAt ? { id: `${task.id}-created`, label: `Task created: ${task.title}`, time: task.registeredAt } : null,
      task.updatedAt ? { id: `${task.id}-updated`, label: `Task updated: ${task.title}`, time: task.updatedAt } : null,
      task.approvalStatus === "pending" ? { id: `${task.id}-submitted`, label: `Task submitted: ${task.title}`, time: task.updatedAt ?? task.registeredAt ?? "Just now" } : null,
      task.approvalStatus === "approved" ? { id: `${task.id}-approved`, label: `Task approved: ${task.title}`, time: task.completedAt ?? task.updatedAt ?? "Just now" } : null,
    ])
    .filter(Boolean) as { id: string; label: string; time: string }[];

  return (
    <AppLayout title={project.name} badge="Project" subtitle={project.description ?? `${project.department} project details`}>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 flex-1">
            <div><div className="text-xs text-muted-foreground">Owner</div><div className="font-medium text-sm mt-0.5">{project.owner}</div></div>
            <div><div className="text-xs text-muted-foreground">Department</div><div className="font-medium text-sm mt-0.5">{project.department}</div></div>
            <div><div className="text-xs text-muted-foreground">Due</div><div className="font-medium text-sm mt-0.5">{project.due}</div></div>
            <div><div className="text-xs text-muted-foreground">Priority</div><div className="mt-0.5"><PriorityBadge priority={project.priority} /></div></div>
            <div><div className="text-xs text-muted-foreground">Team</div><div className="font-medium text-sm mt-0.5 flex items-center gap-1"><Users className="size-3" />{team.length || project.teamSize}</div></div>
            <div><div className="text-xs text-muted-foreground">Progress</div><div className="font-bold text-primary mt-0.5">{progress}%</div></div>
          </div>
        </div>
        <div className="mt-4"><Progress value={progress} className="h-2" /></div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Members Working on This Project</h3>
            <p className="text-xs text-muted-foreground">Member names and the tasks they handled in this project</p>
          </div>
          <Badge variant="outline">{projectMemberSummaries.length} members</Badge>
        </div>
        <div className="grid lg:grid-cols-2 gap-3">
          {projectMemberSummaries.map((member) => {
            const completed = member.tasks.filter((task) => task.status === "completed" || task.status === "approved").length;
            return (
              <div key={member.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10"><AvatarFallback className="bg-primary/10 text-primary text-xs">{member.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.title}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{member.tasks.length} tasks</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Will Do</span><div className="font-semibold text-warning">{member.tasks.filter((task) => task.status === "backlog").length}</div></div>
                  <div><span className="text-muted-foreground">Doing</span><div className="font-semibold text-primary">{member.tasks.filter((task) => task.status !== "backlog" && task.status !== "completed" && task.status !== "approved").length}</div></div>
                  <div><span className="text-muted-foreground">Done</span><div className="font-semibold text-success">{completed}</div></div>
                </div>
                <div className="mt-3 space-y-2">
                  {member.tasks.map((task) => (
                    <div key={task.id} className="rounded-md bg-muted/40 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium truncate">{task.title}</div>
                        <StatusBadge status={task.status === "in-review" ? "in-progress" : task.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">Due {task.due}</span>
                        <span className="font-medium text-foreground">{task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)}%</span>
                      </div>
                    </div>
                  ))}
                  {!member.tasks.length && <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">No task records added for this member yet.</div>}
                </div>
              </div>
            );
          })}
          {!projectMemberSummaries.length && (
            <div className="lg:col-span-2 rounded-lg border p-4 text-center text-sm text-muted-foreground">
              No members have tasks recorded for this project yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">

        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">{role === "member" ? "My Project Work" : "Team Members"}</h3>
            <p className="text-xs text-muted-foreground">
              {role === "member" ? "Tasks assigned to you inside this project" : "Click a team member to view their performed tasks inside this project"}
            </p>
          </div>
          <Badge variant="outline">{projectTasks.length} visible tasks</Badge>
        </div>
        {role !== "member" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedMemberId("all")}
              className={`text-left rounded-lg border p-3 transition-colors ${selectedMemberId === "all" ? "bg-primary/10 border-primary/30" : "hover:bg-muted/40"}`}
            >
              <div className="font-medium text-sm">All Members</div>
              <div className="text-xs text-muted-foreground">{viewerProjectTasks.length} tasks</div>
            </button>
            {(involvedTeam.length ? involvedTeam : team).map((member) => {
              const memberTasks = viewerProjectTasks.filter((task) => task.assigneeId === member.id || task.assignee === member.name);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${selectedMemberId === member.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{member.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.title}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Will</span><div className="font-semibold text-warning">{memberTasks.filter((task) => task.status === "backlog").length}</div></div>
                    <div><span className="text-muted-foreground">Doing</span><div className="font-semibold text-primary">{memberTasks.filter((task) => task.status !== "backlog" && task.status !== "completed" && task.status !== "approved").length}</div></div>
                    <div><span className="text-muted-foreground">Done</span><div className="font-semibold text-success">{memberTasks.filter((task) => task.status === "completed" || task.status === "approved").length}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Will Do</div><div className="text-xl font-bold text-warning">{willDoTasks.length}</div></div>
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Doing</div><div className="text-xl font-bold text-primary">{doingTasks.length}</div></div>
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Done</div><div className="text-xl font-bold text-success">{doneTasks.length}</div></div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Task Details</h3>
            <p className="text-xs text-muted-foreground">All visible daily task records stored under this project</p>
          </div>
          <Badge variant="outline">{projectTasks.length} records</Badge>
        </div>
        <div className="space-y-2">
          {projectTasks.map((task) => (
            <div key={task.id} className={`grid grid-cols-12 items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 ${isDelayedTask(task) ? "border-destructive/40 bg-destructive/5" : ""}`}>
              <div className="col-span-12 lg:col-span-3">
                <div className="font-medium text-sm">{task.title}</div>
                {task.description && <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>}
                <div className="text-xs text-primary font-medium mt-0.5">{task.projectName}</div>
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-xs">
                <div className="text-muted-foreground">Start</div>
                <div className="font-medium">{task.startDate ?? task.startedAt ?? task.registeredAt ?? "Not started"}</div>
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-xs">
                <div className="text-muted-foreground">End</div>
                <div className="font-medium">{task.due}</div>
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)}%</span>
                </div>
                <Progress value={task.completionPercent ?? (task.status === "completed" || task.status === "approved" ? 100 : 0)} className="h-1" />
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-2 text-xs">
                <div className="text-muted-foreground">Reason</div>
                <div className={`font-medium truncate ${isDelayedTask(task) ? "text-destructive" : ""}`}>{task.delayReason || task.pendingReason || (isDelayedTask(task) ? "Delayed task" : "On track")}</div>
              </div>
              <div className="col-span-6 sm:col-span-3 lg:col-span-1 flex justify-end">
                {isDelayedTask(task) ? <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">Delayed</Badge> : <StatusBadge status={task.status === "in-review" ? "in-progress" : task.status} />}
              </div>
            </div>
          ))}
          {!projectTasks.length && <div className="text-sm text-muted-foreground p-4 text-center">No task details are stored under this project yet.</div>}
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Gantt Timeline</h3>
            <div className="space-y-2">
              {taskTimeline.map((task, index) => (
                <div key={task.id} className="grid grid-cols-12 gap-3 items-center text-sm">
                  <div className="col-span-4 truncate font-medium">{task.title}</div>
                  <div className="col-span-6 relative h-7 bg-muted/40 rounded">
                    <div className={`absolute top-0 h-full rounded ${task.status === "completed" || task.status === "approved" ? "bg-success" : "bg-primary/80"}`} style={{ left: `${Math.min(index * 6, 40)}%`, width: `${Math.max(task.completionPercent ?? 20, 18)}%` }} />
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground text-right">{task.startDate ?? "Start"} - {task.due}</div>
                </div>
              ))}
              {!taskTimeline.length && <div className="text-sm text-muted-foreground text-center p-4">No project tasks yet.</div>}
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Progress Analytics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Overall</span><span className="font-semibold">{progress}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tasks</span><span>{projectTasks.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="text-success">{completedCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">In Progress</span><span className="text-primary">{inProgressCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span>{projectTasks.length - completedCount - inProgressCount}</span></div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><UserRound className="size-4" />Project Head</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{projectHead?.name ?? project.owner}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{projectHead?.title ?? "Project Head"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{project.department}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate">{projectHead?.email ?? "Not available"}</span></div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="size-4 text-warning" />Risks & Blockers</h3>
              <div className="space-y-2">
                {risks.map((risk) => (
                  <div key={risk.id} className="flex items-center justify-between p-2 rounded-md border">
                    <span className="text-sm truncate">{risk.title}</span>
                    <Badge variant="outline" className={risk.severity==="high"?"bg-destructive/10 text-destructive":risk.severity==="medium"?"bg-warning/15 text-warning":"bg-muted"}>{risk.severity}</Badge>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input placeholder="New risk..." value={newRisk} onChange={(event)=>setNewRisk(event.target.value)} className="h-8" />
                  <Button size="sm" onClick={()=>{if(newRisk.trim()){addRisk(newRisk,"medium"); setNewRisk(""); toast.success("Risk added");}}}><Plus className="size-3.5" /></Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <Card className="p-5">
            <div className="space-y-2">
              {taskTimeline.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {task.status === "completed" || task.status === "approved" ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground" />}
                    <div><div className="font-medium text-sm">{task.title}</div><div className="text-xs text-muted-foreground">{task.startDate ?? "Start not set"} - {task.due}</div></div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
              {!taskTimeline.length && <div className="text-sm text-muted-foreground text-center p-4">No milestones available until tasks are created.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold">Project Task Register</h3>
              <Badge variant="outline">{projectTasks.length} tasks</Badge>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Will Do", items: willDoTasks, tone: "text-warning" },
                { label: "Doing", items: doingTasks, tone: "text-primary" },
                { label: "Done", items: doneTasks, tone: "text-success" },
              ].map((group) => (
                <div key={group.label} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">{group.label}</div>
                    <div className={`text-sm font-bold ${group.tone}`}>{group.items.length}</div>
                  </div>
                  <div className="space-y-2">
                    {group.items.slice(0, 4).map((task) => (
                      <div key={task.id} className="rounded-md bg-muted/40 p-2">
                        <div className="text-xs font-medium truncate">{task.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{task.assignee} - {task.due}</div>
                      </div>
                    ))}
                    {!group.items.length && <div className="text-xs text-muted-foreground">No tasks</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {projectTasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-3 hover:bg-muted/30">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                      <Checkbox className="mt-0.5" checked={task.status === "completed" || task.status === "approved"} onCheckedChange={(checked)=>updateTaskStatus(task.id, checked ? "completed" : "backlog")} />
                      <span className="min-w-0">
                        <span className={`block font-medium text-sm ${task.status==="completed" || task.status==="approved"?"line-through text-muted-foreground":""}`}>{task.title}</span>
                        {task.description && <span className="block text-xs text-muted-foreground mt-0.5">{task.description}</span>}
                      </span>
                    </label>
                    <StatusBadge status={task.status==="in-review" ? "in-progress" : task.status} />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
                    <div><div className="text-muted-foreground">Assignee</div><div className="font-medium mt-0.5">{task.assignee}</div></div>
                    <div><div className="text-muted-foreground">Created By</div><div className="font-medium mt-0.5">{creatorName(task.createdById)}</div></div>
                    <div><div className="text-muted-foreground">Registered Time</div><div className="font-medium mt-0.5">{task.registeredAt ?? "Not recorded"}</div></div>
                    <div><div className="text-muted-foreground">Started Time</div><div className="font-medium mt-0.5">{task.startedAt ?? "Not started"}</div></div>
                    <div><div className="text-muted-foreground">Due</div><div className="font-medium mt-0.5">{task.due}</div></div>
                    <div><div className="text-muted-foreground">Priority</div><div className="mt-0.5"><PriorityBadge priority={task.priority} /></div></div>
                    <div><div className="text-muted-foreground">Last Updated</div><div className="font-medium mt-0.5">{task.updatedAt ?? "Not recorded"}</div></div>
                    <div><div className="text-muted-foreground">Completed Time</div><div className="font-medium mt-0.5">{task.completedAt ?? "Pending"}</div></div>
                    <div><div className="text-muted-foreground">Department</div><div className="font-medium mt-0.5">{task.department}</div></div>
                  </div>
                </div>
              ))}
              {!projectTasks.length && <div className="text-sm text-muted-foreground text-center p-4">No tasks yet. Use Assign Task to add the first task under this project.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Documents & Attachments</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border text-muted-foreground">
                <FileText className="size-4" /><span className="text-sm">No project documents uploaded yet.</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Project Team ({team.length || project.teamSize})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(team.length ? team : visibleUsers).slice(0, 8).map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{user.initials}</AvatarFallback></Avatar>
                  <div className="min-w-0"><div className="font-medium text-sm truncate">{user.name}</div><div className="text-xs text-muted-foreground">{user.title}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tasks", value: projectTasks.length },
                { label: "Completed", value: completedCount },
                { label: "On-Time %", value: `${progress}%` },
                { label: "Blockers", value: projectTasks.filter((task) => task.status === "blocked").length },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg bg-muted/40"><div className="text-xs text-muted-foreground">{item.label}</div><div className="text-xl font-bold mt-1">{item.value}</div></div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Activity & Comments</h3>
        <div className="space-y-3 mb-4">
          {projectActivity.slice(0, 8).map((item) => (
            <div key={item.id} className="flex gap-3">
              <Avatar className="size-8 shrink-0"><AvatarFallback className="text-xs bg-muted">PM</AvatarFallback></Avatar>
              <div className="flex-1 bg-muted/40 rounded-lg p-3">
                <div className="text-sm">{item.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{item.time}</div>
              </div>
            </div>
          ))}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="size-8 shrink-0"><AvatarFallback className="text-xs bg-muted">{comment.user.split(" ").map((part)=>part[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
              <div className="flex-1 bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{comment.time}</span>
                </div>
                <div className="text-sm">{comment.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea placeholder="Add a comment..." rows={2} value={newComment} onChange={(event)=>setNewComment(event.target.value)} />
          <Button onClick={()=>{if(newComment.trim()){addComment(newComment); setNewComment(""); toast.success("Comment posted");}}}><Send className="size-4" /></Button>
        </div>
      </Card>
    </AppLayout>
  );
}
