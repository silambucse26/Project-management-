import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatCard } from "@/components/common/StatCard";
import { Calendar } from "@/components/ui/calendar";
import { ClipboardList, Clock, CheckCircle2, Timer, Play, Send, HelpCircle, CheckSquare, PlusCircle } from "lucide-react";
import { messages, type Task } from "@/data/mockData";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/my-work")({ component: MyWorkPage });

function statusLabel(status: Task["status"]) {
  if (status === "completed") return "Done";
  if (status === "approved") return "Approved";
  if (status === "in-progress") return "Active";
  if (status === "blocked") return "Blocked";
  return "Pending";
}

const percentOptions = [25, 50, 60, 75, 90, 100];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function MyWorkPage() {
  const { tasks, addTask, updateTaskStatus, updateTaskDetails, submitTaskForReview, currentUser, visibleProjects, addProject, findProjectByName } = useApp();
  const [clockIn] = useState(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [newTask, setNewTask] = useState({ projectName: "", title: "", description: "", startDate: todayISO(), due: "" });
  const [dueOpen, setDueOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("25");

  const completed = tasks.filter((task) => task.status === "completed" || task.status === "approved").length;
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;
  const pending = tasks.filter((task) => task.status !== "completed" && task.status !== "approved" && task.status !== "in-progress").length;
  const total = tasks.length;
  const pct = total ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0;
  const donut = [
    { name: "Done", value: completed },
    { name: "Progress", value: inProgress },
    { name: "Pending", value: pending },
  ];
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  function openDueDatePopup() {
    if (!newTask.title.trim()) return toast.error("Add the task you are going to do first");
    const project = findProjectByName(newTask.projectName);
    if (!project) return toast.error("Create the project first, then add this task.");
    setNewTask((previous) => ({ ...previous, startDate: previous.startDate || todayISO() }));
    setDueOpen(true);
  }

  function planTask() {
    if (!newTask.title.trim()) return toast.error("Add the task you are going to do first");
    if (!newTask.due) return toast.error("Select the last date for completing this task");
    const project = findProjectByName(newTask.projectName);
    if (!project) return toast.error("Create the project first, then add this task.");
    try {
      addTask({
        projectId: project.id,
        projectName: project.name,
        title: newTask.title,
        description: newTask.description,
        assignee: currentUser.name,
        assigneeId: currentUser.id,
        department: project.department,
        startDate: newTask.startDate || todayISO(),
        due: newTask.due,
        priority: "medium",
        status: "backlog",
        approvalStatus: "not-submitted",
        plannedToday: true,
        checklistDone: 0,
        checklistTotal: 0,
      });
      setDueOpen(false);
      setNewTask({ projectName: "", title: "", description: "", startDate: todayISO(), due: "" });
      toast.success("Daily task added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Task could not be created");
    }
  }

  function createProject() {
    if (!newTask.projectName.trim()) return toast.error("Project name required");
    const project = addProject({
      name: newTask.projectName,
      description: `Daily work project created by ${currentUser.name}`,
      owner: currentUser.name,
      ownerId: currentUser.id,
      department: currentUser.department,
      due: newTask.due || "TBD",
      priority: "medium",
    });
    setNewTask((previous) => ({ ...previous, projectName: project.name }));
    toast.success("Project created. Now add the task.");
  }

  function openProgressPopup(task: Task) {
    setSelectedTaskId(task.id);
    setProgressValue(String(task.completionPercent && task.completionPercent > 0 ? task.completionPercent : 25));
    setProgressOpen(true);
  }

  function saveProgress() {
    if (!selectedTask) return;
    const completionPercent = Number(progressValue);
    updateTaskDetails(selectedTask.id, { completionPercent });
    setProgressOpen(false);
    toast.success(completionPercent >= 100 ? "Task completed" : "Task progress saved");
  }

  function start(id: string) {
    updateTaskStatus(id, "in-progress");
    toast.success("Task started");
  }

  return (
    <AppLayout title="My Work" badge="Team Member" subtitle={`${currentUser.name} - ${currentUser.department}`}>
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-info/10 border-primary/20 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Good morning, {currentUser.name.split(" ")[0]}.</h2>
            <p className="text-sm text-muted-foreground mt-1">Add the task, link it to a project, and track it through completion.</p>
          </div>
          <Badge className="bg-primary/15 text-primary border-primary/20" variant="outline">Plan Task</Badge>
        </div>
        <div className="mt-5 rounded-lg border bg-card p-4">
          <div className="grid lg:grid-cols-[1.05fr_1.15fr_1.35fr_auto] gap-3 items-end">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Project</Label>
              <div className="flex gap-2 mt-1">
                <Input className="h-11 bg-background" value={newTask.projectName} onChange={(event) => setNewTask({ ...newTask, projectName: event.target.value })} placeholder="Type project name" list="my-work-projects" />
                <Button className="h-11 shrink-0" variant="outline" onClick={createProject}><PlusCircle className="size-4" />Create</Button>
              </div>
              <datalist id="my-work-projects">{visibleProjects.map((project) => <option key={project.id} value={project.name} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Task</Label>
              <Input className="h-11 mt-1 bg-background" value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} placeholder="What will you do first?" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Details</Label>
              <Textarea className="min-h-11 mt-1 bg-background resize-none" value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })} placeholder="Add short task details" rows={1} />
            </div>
            <Button className="h-11 px-6 shadow-sm" onClick={openDueDatePopup}><Send className="size-4" />Add Task</Button>
          </div>
        </div>
      </Card>

      <Dialog open={dueOpen} onOpenChange={setDueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Due Date Selection</DialogTitle>
            <DialogDescription>Select the last date for completing this task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Project Name</Label><Input value={newTask.projectName} readOnly /></div>
              <div><Label>Task Name</Label><Input value={newTask.title} readOnly /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={newTask.startDate || todayISO()} readOnly /></div>
              <div><Label>Due Date</Label><Input type="date" value={newTask.due} onChange={(event)=>setNewTask({...newTask, due: event.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDueOpen(false)}>Cancel</Button>
            <Button onClick={planTask}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Tasks" value={total} icon={ClipboardList} tone="primary" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="warning" />
        <StatCard label="Completed Today" value={completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Clocked In" value={clockIn} icon={Timer} tone="info" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Daily Progress</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={donut} dataKey="value" innerRadius={55} outerRadius={80} startAngle={90} endAngle={-270}>
                  <Cell fill="var(--success)" /><Cell fill="var(--primary)" /><Cell fill="var(--muted)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold">{pct}%</div>
              <div className="text-xs text-muted-foreground">Progress</div>
            </div>
          </div>
          <Progress value={pct} className="h-2 mt-3" />
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Status Tracker</h3>
          <div className="space-y-3">
            {[
              { label: "Clocked In", value: clockIn, className: "text-success" },
              { label: "In Progress", value: `${inProgress} tasks`, className: "text-primary" },
              { label: "Pending", value: `${pending} tasks`, className: "text-warning" },
              { label: "Completed", value: `${completed} tasks`, className: "text-success" },
            ].map((status) => (
              <div key={status.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                <span className="text-sm font-medium">{status.label}</span>
                <span className={`text-xs font-medium ${status.className}`}>{status.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => tasks[0] ? start(tasks[0].id) : toast.error("No task available")}><Play className="size-4" /><span className="text-xs">Start First</span></Button>
            <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => tasks[0] ? (submitTaskForReview(tasks[0].id), toast.success("Submitted for review")) : toast.error("No task available")}><Send className="size-4" /><span className="text-xs">Submit Review</span></Button>
            <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => toast.success("Help requested")}><HelpCircle className="size-4" /><span className="text-xs">Ask Help</span></Button>
            <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => tasks[0] ? openProgressPopup(tasks[0]) : toast.error("No task available")}><CheckSquare className="size-4" /><span className="text-xs">Complete First</span></Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Task Details</h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="grid grid-cols-12 items-center gap-3 p-3 rounded-lg border hover:bg-muted/30">
              <div className="col-span-12 sm:col-span-4">
                <div className="font-medium text-sm">{task.title}</div>
                {task.projectName && <div className="text-xs text-primary font-medium mt-0.5">{task.projectName}</div>}
                {task.description && <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>}
              </div>
              <div className="col-span-4 sm:col-span-2 text-xs">
                <div className="text-muted-foreground">Start</div>
                <div className="font-medium">{task.startDate ?? "Today"}</div>
              </div>
              <div className="col-span-4 sm:col-span-2 text-xs">
                <div className="text-muted-foreground">Due</div>
                <div className="font-medium">{task.due}</div>
              </div>
              <div className="col-span-4 sm:col-span-1 text-xs">
                <div className="font-medium">{task.completionPercent ?? (task.status === "completed" ? 100 : 0)}%</div>
                <Progress value={task.completionPercent ?? (task.status === "completed" ? 100 : 0)} className="h-1 mt-1" />
                <div className="mt-1 text-[11px] text-warning">{100 - (task.completionPercent ?? (task.status === "completed" ? 100 : 0))}% balance</div>
              </div>
              <div className="col-span-4 sm:col-span-1">
                <Badge variant="outline" className={task.status === "completed" || task.status === "approved" ? "bg-success/15 text-success border-success/20" : task.status === "in-progress" ? "bg-primary/15 text-primary border-primary/20" : task.status === "blocked" ? "bg-destructive/15 text-destructive border-destructive/20" : "bg-muted"}>
                  {statusLabel(task.status)}
                </Badge>
              </div>
              <div className="col-span-12 sm:col-span-2 flex gap-1 justify-end">
                {task.status !== "completed" && task.status !== "approved" && task.status !== "in-progress" && <Button size="sm" variant="outline" onClick={() => start(task.id)}>Start</Button>}
                {task.status !== "completed" && task.status !== "approved" && <Button size="sm" variant="outline" onClick={() => openProgressPopup(task)}>Update</Button>}
                {task.status !== "completed" && task.status !== "approved" && <Button size="sm" variant="outline" onClick={() => submitTaskForReview(task.id)}>Submit</Button>}
                {task.status !== "completed" && task.status !== "approved" && <Button size="sm" onClick={() => openProgressPopup(task)}>Complete</Button>}
              </div>
            </div>
          ))}
          {!tasks.length && <div className="text-sm text-muted-foreground p-4 text-center">Add your first daily task above.</div>}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Calendar</h3>
          <Calendar mode="single" className="rounded-md" />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Recent Messages</h3>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="bg-muted/40 rounded-lg p-3">
                <div className="font-medium text-sm">{message.from}</div>
                <div className="text-sm mt-0.5">{message.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
