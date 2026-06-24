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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatCard } from "@/components/common/StatCard";
import { Calendar } from "@/components/ui/calendar";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Timer,
  Play,
  Send,
  PlusCircle,
} from "lucide-react";
import { type Task } from "@/data/mockData";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/my-work")({
  component: MyWorkPage,
});

type TaskWithAssignment = Task & {
  assignedBy?: string;
  assignedById?: string;
  assignedMessage?: string;
  createdBy?: string;
  createdById?: string;
  createdByName?: string;
};

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
  const {
    tasks,
    addTask,
    updateTaskStatus,
    updateTaskDetails,
    submitTaskForReview,
    currentUser,
    visibleProjects,
    addProject,
    findProjectByName,
  } = useApp();

  const myTasks = tasks.filter(
    (task) =>
      task.assigneeId === currentUser.id ||
      task.assignee === currentUser.name
  ) as TaskWithAssignment[];

  const createdByMeTasks = myTasks.filter(
    (task) =>
      task.createdById === currentUser.id ||
      task.assignedById === currentUser.id ||
      task.assignedBy === currentUser.name ||
      task.createdByName === currentUser.name ||
      task.createdBy === currentUser.name
  );

  const assignedByHeadTasks = myTasks.filter(
    (task) =>
      !createdByMeTasks.some((createdTask) => createdTask.id === task.id)
  );

  const [clockIn] = useState(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const [newTask, setNewTask] = useState({
    projectName: "",
    title: "",
    description: "",
    startDate: todayISO(),
    due: "",
  });

  const [dueOpen, setDueOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("25");

  const completed = myTasks.filter(
    (task) => task.status === "completed" || task.status === "approved"
  ).length;

  const pending = myTasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "approved" &&
      task.status !== "in-progress"
  ).length;

  const total = myTasks.length;
  const selectedTask = myTasks.find((task) => task.id === selectedTaskId);

  function openDueDatePopup() {
    if (!newTask.title.trim()) {
      return toast.error("Add the task you are going to do first");
    }

    const project = findProjectByName(newTask.projectName);

    if (!project) {
      return toast.error("Create the project first, then add this task.");
    }

    setNewTask((previous) => ({
      ...previous,
      startDate: previous.startDate || todayISO(),
    }));

    setDueOpen(true);
  }

  function planTask() {
    if (!newTask.title.trim()) {
      return toast.error("Add the task you are going to do first");
    }

    if (!newTask.due) {
      return toast.error("Select the last date for completing this task");
    }

    const project = findProjectByName(newTask.projectName);

    if (!project) {
      return toast.error("Create the project first, then add this task.");
    }

    addTask({
      projectId: project.id,
      projectName: project.name,
      title: newTask.title,
      description: newTask.description,
      assignee: currentUser.name,
      assigneeId: currentUser.id,

      createdById: currentUser.id,
      createdByName: currentUser.name,
      assignedById: currentUser.id,
      assignedBy: currentUser.name,
      assignedMessage: `${currentUser.name} created this task`,

      department: project.department,
      startDate: newTask.startDate || todayISO(),
      due: newTask.due,
      priority: "medium",
      status: "backlog",
      approvalStatus: "not-submitted",
      plannedToday: true,
      checklistDone: 0,
      checklistTotal: 0,
    } as TaskWithAssignment);

    setDueOpen(false);
    setNewTask({
      projectName: "",
      title: "",
      description: "",
      startDate: todayISO(),
      due: "",
    });

    toast.success("Daily task added");
  }

  function createProject() {
    if (!newTask.projectName.trim()) {
      return toast.error("Project name required");
    }

    const project = addProject({
      name: newTask.projectName,
      description: `Daily work project created by ${currentUser.name}`,
      owner: currentUser.name,
      ownerId: currentUser.id,
      department: currentUser.department,
      due: newTask.due || "TBD",
      priority: "medium",
    });

    setNewTask((previous) => ({
      ...previous,
      projectName: project.name,
    }));

    toast.success("Project created. Now add the task.");
  }

  function openProgressPopup(task: Task) {
    setSelectedTaskId(task.id);
    setProgressValue(
      String(
        task.completionPercent && task.completionPercent > 0
          ? task.completionPercent
          : 25
      )
    );
    setProgressOpen(true);
  }

  function saveProgress() {
    if (!selectedTask) return;

    const completionPercent = Number(progressValue);
    updateTaskDetails(selectedTask.id, { completionPercent });
    setProgressOpen(false);

    toast.success(
      completionPercent >= 100 ? "Task completed" : "Task progress saved"
    );
  }

  function start(id: string) {
    updateTaskStatus(id, "in-progress");
    toast.success("Task started");
  }

  function TaskRow({
    task,
    type,
  }: {
    task: TaskWithAssignment;
    type: "assigned" | "created";
  }) {
    const progress =
      task.completionPercent ?? (task.status === "completed" ? 100 : 0);

    const givenBy =
      task.assignedBy ||
      task.createdByName ||
      task.createdBy ||
      "Head / Manager";

    return (
      <div className="grid grid-cols-12 items-center gap-3 p-3 rounded-lg border hover:bg-muted/30">
        <div className="col-span-12 sm:col-span-4">
          <div className="font-medium text-sm">{task.title}</div>

          <div className="text-xs text-primary font-medium mt-0.5">
            Project: {task.projectName || "No project"}
          </div>

          {type === "assigned" ? (
            <>
              <div className="text-xs text-muted-foreground mt-1">
                Assigned By: {givenBy}
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                Message: {task.assignedMessage || "No message provided."}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">
              Created By: You
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-1">
            Description: {task.description || "No description provided."}
          </div>
        </div>

        <div className="col-span-4 sm:col-span-2 text-xs">
          <div className="text-muted-foreground">Start</div>
          <div className="font-medium">{task.startDate ?? "Today"}</div>
        </div>

        <div className="col-span-4 sm:col-span-2 text-xs">
          <div className="text-muted-foreground">Due</div>
          <div className="font-medium">{task.due || "No due date"}</div>
        </div>

        <div className="col-span-4 sm:col-span-1 text-xs">
          <div className="font-medium">{progress}%</div>
          <Progress value={progress} className="h-1 mt-1" />
        </div>

        <div className="col-span-4 sm:col-span-1">
          <Badge variant="outline">{statusLabel(task.status)}</Badge>
        </div>

        <div className="col-span-12 sm:col-span-2 flex gap-1 justify-end">
          {task.status !== "completed" &&
            task.status !== "approved" &&
            task.status !== "in-progress" && (
              <Button size="sm" variant="outline" onClick={() => start(task.id)}>
                Start
              </Button>
            )}

          {task.status !== "completed" && task.status !== "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openProgressPopup(task)}
            >
              Update
            </Button>
          )}

          {task.status !== "completed" && task.status !== "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => submitTaskForReview(task.id)}
            >
              Submit
            </Button>
          )}

          {task.status !== "completed" && task.status !== "approved" && (
            <Button size="sm" onClick={() => openProgressPopup(task)}>
              Complete
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      title="My Work"
      badge="Team Member"
      subtitle={`${currentUser.name} - ${currentUser.department}`}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-info/10 border-primary/20 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              Good morning, {currentUser.name.split(" ")[0]}.
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View tasks assigned by your Head / Manager and tasks created by you.
            </p>
          </div>

          <Badge className="bg-primary/15 text-primary border-primary/20" variant="outline">
            Plan Task
          </Badge>
        </div>

        <div className="mt-5 rounded-lg border bg-card p-4">
          <div className="grid lg:grid-cols-[1.05fr_1.15fr_1.35fr_auto] gap-3 items-end">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Project
              </Label>

              <div className="flex gap-2 mt-1">
                <Input
                  className="h-11 bg-background"
                  value={newTask.projectName}
                  onChange={(event) =>
                    setNewTask({ ...newTask, projectName: event.target.value })
                  }
                  placeholder="Type project name"
                  list="my-work-projects"
                />

                <Button
                  className="h-11 shrink-0"
                  variant="outline"
                  onClick={createProject}
                >
                  <PlusCircle className="size-4" />
                  Create
                </Button>
              </div>

              <datalist id="my-work-projects">
                {visibleProjects.map((project) => (
                  <option key={project.id} value={project.name} />
                ))}
              </datalist>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Task
              </Label>

              <Input
                className="h-11 mt-1 bg-background"
                value={newTask.title}
                onChange={(event) =>
                  setNewTask({ ...newTask, title: event.target.value })
                }
                placeholder="What will you do first?"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Details
              </Label>

              <Textarea
                className="min-h-11 mt-1 bg-background resize-none"
                value={newTask.description}
                onChange={(event) =>
                  setNewTask({ ...newTask, description: event.target.value })
                }
                placeholder="Add short task details"
                rows={1}
              />
            </div>

            <Button className="h-11 px-6 shadow-sm" onClick={openDueDatePopup}>
              <Send className="size-4" />
              Add Task
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={total} icon={ClipboardList} tone="primary" />
        <StatCard label="Assigned by Head" value={assignedByHeadTasks.length} icon={Clock} tone="warning" />
        <StatCard label="Created by Me" value={createdByMeTasks.length} icon={Timer} tone="info" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Tasks Assigned by Head / Manager</h3>
            <p className="text-xs text-muted-foreground">
              Tasks assigned to you by your Head / Manager.
            </p>
          </div>

          <Badge variant="outline">{assignedByHeadTasks.length} Tasks</Badge>
        </div>

        <div className="space-y-2">
          {assignedByHeadTasks.map((task) => (
            <TaskRow key={task.id} task={task} type="assigned" />
          ))}

          {!assignedByHeadTasks.length && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              No tasks assigned by Head / Manager.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Tasks Created by Me</h3>
            <p className="text-xs text-muted-foreground">
              Tasks that you created for yourself.
            </p>
          </div>

          <Badge variant="outline">{createdByMeTasks.length} Tasks</Badge>
        </div>

        <div className="space-y-2">
          {createdByMeTasks.map((task) => (
            <TaskRow key={task.id} task={task} type="created" />
          ))}

          {!createdByMeTasks.length && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              You have not created any tasks.
            </div>
          )}
        </div>
      </Card>

      <Dialog open={dueOpen} onOpenChange={setDueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Due Date Selection</DialogTitle>
            <DialogDescription>
              Select the last date for completing this task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Project Name</Label>
                <Input value={newTask.projectName} readOnly />
              </div>

              <div>
                <Label>Task Name</Label>
                <Input value={newTask.title} readOnly />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newTask.startDate || todayISO()} readOnly />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due}
                  onChange={(event) =>
                    setNewTask({ ...newTask, due: event.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={planTask}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Progress</DialogTitle>
            <DialogDescription>
              How much of the task has been completed?
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Task</div>
                <div className="font-medium">{selectedTask.title}</div>
              </div>

              <RadioGroup
                value={progressValue}
                onValueChange={setProgressValue}
                className="gap-3"
              >
                {percentOptions.map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/40"
                  >
                    <RadioGroupItem value={String(value)} />
                    <span className="text-sm font-medium">
                      {value}% Complete
                      {value === 100 ? " (Fully Completed)" : ""}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProgress}>
              {Number(progressValue) === 100
                ? "Mark as Completed"
                : "Save Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}