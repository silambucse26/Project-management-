import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/common/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Clock, AlertOctagon, Plus, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/app-store";
import type { Task } from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({ component: TasksPage });

const columns: { id: Task["status"]; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "bg-muted" },
  { id: "in-progress", label: "In Progress", color: "bg-primary" },
  { id: "in-review", label: "In Review", color: "bg-purple" },
  { id: "blocked", label: "Blocked", color: "bg-destructive" },
  { id: "changes", label: "Changes", color: "bg-warning" },
  { id: "completed", label: "Completed", color: "bg-success" },
  { id: "approved", label: "Approved", color: "bg-success" },
];

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

function isDelayed(task: Task) {
  if (task.status === "completed" || task.status === "approved") return false;
  const dueDate = parseDueDate(task.due);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function displayDueDate(value: string) {
  const dueDate = parseDueDate(value);
  if (!dueDate) return value || "TBD";
  return dueDate.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

const percentOptions = [25, 50, 60, 75, 90, 100];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TasksPage() {
  const { tasks, addTask, updateTaskStatus, updateTaskDetails, submitTaskDelayReason, submitTaskForReview, visibleUsers, currentUser, role, visibleProjects, addProject, findProjectByName } = useApp();
  const [open, setOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState({ pendingReason: "", delayReason: "" });
  const [progressValue, setProgressValue] = useState("25");
  const assignableUsers = visibleUsers.filter((user) => user.role === "member" || user.id === currentUser.id);
  const [form, setForm] = useState({ projectName: "", title: "", desc: "", assigneeId: "", reviewerId: "", priority: "medium" as Task["priority"], status: "backlog" as Task["status"], startDate: todayISO(), due: "" });

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = {};
    columns.forEach(c => g[c.id] = []);
    tasks.forEach(t => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  const delayedTasks = tasks.filter(isDelayed);
  const criticalTasks = tasks.filter(t => t.status !== "completed" && t.priority === "critical").length;
  const due = tasks.filter(t => t.status !== "completed" && t.status !== "approved").length;
  const blocked = tasks.filter(t => t.status === "blocked").length;
  const review = tasks.filter(t => t.status === "in-review").length;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  function openDueDatePopup() {
    const assignee = assignableUsers.find((user) => user.id === form.assigneeId);
    if (!form.title || !assignee) return toast.error("Title and assignee required");
    const project = findProjectByName(form.projectName);
    if (!project) return toast.error("Create the project first, then add the task under it.");
    setForm((previous) => ({ ...previous, startDate: previous.startDate || todayISO() }));
    setDueOpen(true);
  }

  function submit() {
    const assignee = assignableUsers.find((user) => user.id === form.assigneeId);
    if (!form.title || !assignee) return toast.error("Title and assignee required");
    if (!form.due) return toast.error("Select the last date for completing this task");
    const project = findProjectByName(form.projectName);
    if (!project) return toast.error("Create the project first, then add the task under it.");
    try {
      addTask({
        projectId: project.id, projectName: project.name,
        title: form.title, description: form.desc, assignee: assignee.name, assigneeId: assignee.id, department: project.department,
        priority: form.priority, status: "backlog", startDate: form.startDate || todayISO(), due: form.due,
        reviewerId: form.reviewerId || undefined,
        reviewerName: visibleUsers.find((user) => user.id === form.reviewerId)?.name,
        approvalStatus: "not-submitted",
        plannedToday: true, checklistDone: 0, checklistTotal: 0,
      });
      toast.success("Task added successfully");
      setDueOpen(false);
      setOpen(false);
      setForm({ projectName: "", title: "", desc: "", assigneeId: "", reviewerId: "", priority: "medium", status: "backlog", startDate: todayISO(), due: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task could not be created");
    }
  }

  function createProjectFromTask() {
    if (!form.projectName.trim()) return toast.error("Project name required");
    const assignee = assignableUsers.find((user) => user.id === form.assigneeId);
    if (role === "admin" && !assignee) return toast.error("Select an assignee first so the project uses the right department.");
    const project = addProject({
      name: form.projectName,
      description: `Project created from task board by ${currentUser.name}`,
      owner: currentUser.name,
      ownerId: currentUser.id,
      department: assignee?.department ?? currentUser.department,
      due: form.due || "TBD",
      priority: form.priority,
    });
    setForm((previous) => ({ ...previous, projectName: project.name }));
    toast.success("Project created. Now add the task.");
  }

  function moveTask(t: Task, dir: 1 | -1) {
    const idx = columns.findIndex(c => c.id === t.status);
    const next = columns[idx + dir];
    if (next) { updateTaskStatus(t.id, next.id); toast.success(`Moved to ${next.label}`); }
  }

  function openTaskDetails(task: Task) {
    setSelectedTaskId(task.id);
    setDetailForm({
      pendingReason: task.pendingReason ?? "",
      delayReason: task.delayReason ?? "",
    });
    setDetailOpen(true);
  }

  function openProgressPopup(task: Task) {
    setSelectedTaskId(task.id);
    setProgressValue(String(task.completionPercent && task.completionPercent > 0 ? task.completionPercent : 25));
    setProgressOpen(true);
  }

  function saveProgress() {
    if (!selectedTask) return;
    const completionPercent = Number(progressValue);
    updateTaskDetails(selectedTask.id, {
      completionPercent,
      pendingReason: completionPercent < 100 ? detailForm.pendingReason : "",
    });
    setProgressOpen(false);
    toast.success(completionPercent >= 100 ? "Task marked completed" : "Task progress saved");
  }

  function sendDelayReason() {
    if (!selectedTask) return;
    if (!detailForm.delayReason.trim()) return toast.error("Enter the delay reason");
    submitTaskDelayReason(selectedTask.id, detailForm.delayReason.trim());
    toast.success("Delay reason sent to approvals");
  }

  return (
    <AppLayout title="Task Board" badge="Kanban" subtitle="Assign, track, and manage workflow">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Open Tasks" value={due} icon={Calendar} tone="primary" />
        <StatCard label="Blocked Tasks" value={blocked} icon={AlertOctagon} tone="destructive" />
        <StatCard label="Delayed Tasks" value={delayedTasks.length} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Pending Reviews" value={review} icon={Clock} tone="purple" />
        <StatCard label="Critical Tasks" value={criticalTasks} icon={ShieldCheck} tone="warning" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kanban Board</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="size-4" />Add Task</Button></SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Add New Task</SheetTitle></SheetHeader>
            <div className="space-y-4 p-4">
              <div><Label>Project Name</Label>
                <div className="flex gap-2">
                  <Input value={form.projectName} onChange={e=>setForm({...form, projectName: e.target.value})} placeholder="Select or type project name" list="task-projects" />
                  <Button type="button" variant="outline" onClick={createProjectFromTask}>Create</Button>
                </div>
                <datalist id="task-projects">{visibleProjects.map(project=><option key={project.id} value={project.name} />)}</datalist>
              </div>
              <div><Label>Task Title</Label><Input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="e.g. Review Q3 specs" /></div>
              <div><Label>Description</Label><Textarea value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} placeholder="Details..." rows={3} /></div>
              <div><Label>Assignee</Label>
                <Select value={form.assigneeId} onValueChange={v=>setForm({...form, assigneeId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
                  <SelectContent>{assignableUsers.map(user=><SelectItem key={user.id} value={user.id}>{user.name} - {user.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Reviewer / Department Head</Label>
                <Select value={form.reviewerId} onValueChange={v=>setForm({...form, reviewerId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                  <SelectContent>{visibleUsers.filter((user)=>user.role==="head").map(user=><SelectItem key={user.id} value={user.id}>{user.name} - {user.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v=>setForm({...form, priority: v as Task["priority"]})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["low","medium","high","critical"].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} readOnly /></div>
              </div>
              <div><Label>Created By</Label><Input value={currentUser.name} readOnly /></div>
              <div className="flex items-center justify-between p-3 rounded-lg border"><Label className="text-sm">Notify Assignee</Label><Switch defaultChecked /></div>
            </div>
            <SheetFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={openDueDatePopup}>Add Task</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={dueOpen} onOpenChange={setDueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Due Date Selection</DialogTitle>
            <DialogDescription>Select the last date for completing this task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Project Name</Label><Input value={form.projectName} readOnly /></div>
              <div><Label>Task Name</Label><Input value={form.title} readOnly /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate || todayISO()} readOnly /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due} onChange={(event)=>setForm({...form, due: event.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDueOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {selectedTask ? (
            <div className="space-y-5 p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-snug">{selectedTask.title}</h3>
                    <p className="text-xs text-primary font-medium">{selectedTask.projectName}</p>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>
                {selectedTask.description && <p className="text-sm text-muted-foreground">{selectedTask.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Project Name</div>
                  <div className="font-medium mt-1">{selectedTask.projectName}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Task Status</div>
                  <div className="mt-1"><StatusBadge status={selectedTask.status} /></div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Start Date</div>
                  <div className="font-medium mt-1">{displayDueDate(selectedTask.startDate ?? selectedTask.registeredAt ?? "")}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">End Date</div>
                  <div className="font-medium mt-1">{displayDueDate(selectedTask.due)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Assignee</div>
                  <div className="font-medium mt-1">{selectedTask.assignee}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Approval</div>
                  <div className="mt-1"><StatusBadge status={selectedTask.approvalStatus ?? "not-submitted"} /></div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Delay</div>
                  <div className="mt-1">{isDelayed(selectedTask) ? <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">Delayed Task</Badge> : <Badge variant="outline">On Time</Badge>}</div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>Current Progress</Label>
                  <span className="text-sm font-semibold">{selectedTask.completionPercent ?? (selectedTask.status === "completed" ? 100 : 0)}%</span>
                </div>
                <Progress value={selectedTask.completionPercent ?? (selectedTask.status === "completed" ? 100 : 0)} className="h-2" />
              </div>

              {(selectedTask.completionPercent ?? 0) < 100 && (
                <div className="space-y-2">
                  <Label>Pending Reason</Label>
                  <Textarea value={detailForm.pendingReason} onChange={(event)=>setDetailForm({...detailForm, pendingReason: event.target.value})} placeholder="Why is this task still pending?" rows={3} />
                </div>
              )}

              {isDelayed(selectedTask) && (
                <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <Label>Delay Reason</Label>
                  <Textarea value={detailForm.delayReason} onChange={(event)=>setDetailForm({...detailForm, delayReason: event.target.value})} placeholder="Explain the reason for delay" rows={3} />
                  <Button variant="outline" className="w-full" onClick={sendDelayReason}>Send Delay Reason to Approvals</Button>
                </div>
              )}

              <SheetFooter>
                <Button variant="outline" onClick={()=>setDetailOpen(false)}>Close</Button>
                <Button variant="outline" onClick={()=>openProgressPopup(selectedTask)}>Update Progress</Button>
                {selectedTask.approvalStatus !== "pending" && selectedTask.approvalStatus !== "approved" && (
                  <Button variant="outline" onClick={()=>{submitTaskForReview(selectedTask.id); setDetailOpen(false); toast.success("Task submitted for review");}}>Submit for Review</Button>
                )}
                <Button onClick={()=>openProgressPopup(selectedTask)}>Complete Task</Button>
              </SheetFooter>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Select a task to view details.</div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Progress</DialogTitle>
            <DialogDescription>How much of the task has been completed?</DialogDescription>
          </DialogHeader>
          {selectedTask ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Task</div>
                <div className="font-medium">{selectedTask.title}</div>
              </div>
              <RadioGroup value={progressValue} onValueChange={setProgressValue} className="gap-3">
                {percentOptions.map((value) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/40">
                    <RadioGroupItem value={String(value)} />
                    <span className="text-sm font-medium">{value}% Complete{value === 100 ? " (Fully Completed)" : ""}</span>
                  </label>
                ))}
              </RadioGroup>
              <div className="rounded-lg border p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Status Rules</span>
                  <span className="font-medium">{Number(progressValue) === 100 ? "Completed" : "In Progress"}</span>
                </div>
                <Progress value={Number(progressValue)} className="h-2" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><span className="font-semibold">{progressValue}%</span> completed</div>
                  <div className="rounded-md bg-warning/15 p-2 text-warning"><span className="font-semibold">{100 - Number(progressValue)}%</span> balance</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">0-99% stays In Progress. Only 100% becomes Completed.</div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setProgressOpen(false)}>Cancel</Button>
            <Button onClick={saveProgress}>{Number(progressValue) === 100 ? "Mark as Completed" : "Save Progress"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  <div className="space-y-4">
    {columns.map((col) => (
      <Card key={col.id} className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
         <div className="flex items-center gap-2">
           <div className={'size-2 rounded-full ${col.color}'} />
           <h3  className="font-semibold">{col.label}</h3>
           </div>
           <Badge variant="outline">
            {grouped[col.id].length}tasks
            </Badge>
           </div>

           {grouped[col.id].length == 0 ? (
            <div className="p-6 text-sm text -muted-foreground">
              No tasks in {col.label}
            </div>
           )  :  (
            <div className="divide-y">
              {grouped[col.id].map((t) => {
                 const progress =
                  t.completionPercent ??
                  (t.status == "completed" || t.status === "approved" ? 100 : 0);
                const delayed = isDelayed(t);
                return (
                   <div 
                    key={t.id}
                    className="grid grid-cols-1 gap-3 px-4 py-4 hover:bg-muted/30 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
                    >
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.projectName}
                        </div>
                      </div>
                      <div className="text-sm">{t.department}</div>
                      <PriorityBadge priority={t.priority} />
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{progress}%</div>
                        <progress value={progress} className="h-1.5" />
                      </div>
                      <div
                  className={`text-sm ${
                    delayed ? "font-semibold text-destructive" : ""
                  }`}
                >
                  {displayDueDate(t.due)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openTaskDetails(t)}
                  >
                    View
                  </Button>

                  {t.approvalStatus !== "pending" &&
                    t.approvalStatus !== "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          submitTaskForReview(t.id);
                          toast.success("Submitted for review");
                        }}
                      >
                        Submit
                      </Button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  ))}
</div>
    </AppLayout>
  );
}
