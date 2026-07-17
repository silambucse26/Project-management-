import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/teams/$id")({
  component: TeamMemberDetailsPage,
});

function TeamMemberDetailsPage() {
  const { id } = Route.useParams();
  const {
    visibleUsers,
    currentUser,
    role,
    tasks,
    visibleProjects,
  } = useApp();

  const canViewMemberWork = role === "admin" || role === "head";
  const member = visibleUsers.find(
    (user) => user.id === id && user.role === "member",
  );

  if (!canViewMemberWork) {
    return (
      <AppLayout
        title="Team Member Details"
        badge="Restricted"
        subtitle="Only admins and department heads can view member work details"
      >
        <Card className="p-6">
          <h2 className="font-semibold text-lg">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Team members cannot view another member&apos;s complete work details.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/teams">
              <ArrowLeft className="size-4" />
              Back to Teams
            </Link>
          </Button>
        </Card>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout
        title="Team Member Details"
        badge="Not Found"
        subtitle="The requested team member is unavailable"
      >
        <Card className="p-6">
          <h2 className="font-semibold text-lg">Member not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The member may not exist or may not be visible in your department.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/teams">
              <ArrowLeft className="size-4" />
              Back to Teams
            </Link>
          </Button>
        </Card>
      </AppLayout>
    );
  }

  // Department heads can only view members from their own department.
  if (
    role === "head" &&
    member.department !== currentUser.department
  ) {
    return (
      <AppLayout
        title="Team Member Details"
        badge="Restricted"
        subtitle="Department access is limited"
      >
        <Card className="p-6">
          <h2 className="font-semibold text-lg">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Department heads can only view members in their own department.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/teams">
              <ArrowLeft className="size-4" />
              Back to Teams
            </Link>
          </Button>
        </Card>
      </AppLayout>
    );
  }

  const memberTasks = tasks.filter(
    (task) =>
      task.assigneeId === member.id ||
      task.assignee === member.name,
  );

  const memberProjects = visibleProjects.filter((project) =>
    memberTasks.some(
      (task) =>
        task.projectId === project.id ||
        task.projectName === project.name,
    ),
  );

  const activeTasks = memberTasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "approved",
  );

  const completedTasks = memberTasks.filter(
    (task) =>
      task.status === "completed" ||
      task.status === "approved",
  );

  const blockedTasks = memberTasks.filter(
    (task) => task.status === "blocked",
  );

  return (
    <AppLayout
      title={member.name}
      badge="Team Member"
      subtitle={`${member.department} work details`}
    >
      <Button variant="outline" size="sm" asChild>
        <Link to="/teams">
          <ArrowLeft className="size-4" />
          Back to Teams
        </Link>
      </Button>

      <Card className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {member.initials}
            </AvatarFallback>
          </Avatar>

          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Name" value={member.name} />
            <Detail
              label="Employee ID"
              value={member.employeeId ?? member.id}
            />
            <Detail label="Database ID" value={member.id} />
            <Detail label="Email" value={member.email} />
            <Detail label="Department" value={member.department} />
            <Detail label="Role / Title" value={member.title} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Projects" value={memberProjects.length} />
        <SummaryCard label="Total Tasks" value={memberTasks.length} />
        <SummaryCard label="Active Tasks" value={activeTasks.length} />
        <SummaryCard label="Completed" value={completedTasks.length} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Projects Working On</h2>
            <p className="text-sm text-muted-foreground">
              Projects are calculated from the member&apos;s assigned tasks.
            </p>
          </div>
          <Badge variant="outline">{memberProjects.length} projects</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {memberProjects.map((project) => {
            const projectTasks = memberTasks.filter(
              (task) =>
                task.projectId === project.id ||
                task.projectName === project.name,
            );

            const projectCompleted = projectTasks.filter(
              (task) =>
                task.status === "completed" ||
                task.status === "approved",
            ).length;

            const projectProgress = projectTasks.length
              ? Math.round(
                  projectTasks.reduce(
                    (total, task) =>
                      total +
                      (task.completionPercent ??
                        (task.status === "completed" ||
                        task.status === "approved"
                          ? 100
                          : 0)),
                    0,
                  ) / projectTasks.length,
                )
              : project.progress;

            return (
              <Card key={project.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/projects/$id"
                      params={{ id: project.id }}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.department} · Due {project.due}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {projectCompleted}/{projectTasks.length} done
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{projectProgress}%</span>
                  </div>
                  <Progress value={projectProgress} />
                </div>
              </Card>
            );
          })}

          {!memberProjects.length && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground md:col-span-2">
              This member is not currently linked to any project.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Assigned Tasks</h2>
            <p className="text-sm text-muted-foreground">
              Existing task records assigned to this member.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Active: {activeTasks.length}</Badge>
            <Badge variant="outline">Blocked: {blockedTasks.length}</Badge>
            <Badge variant="outline">Done: {completedTasks.length}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {memberTasks.map((task) => {
            const completion =
              task.completionPercent ??
              (task.status === "completed" ||
              task.status === "approved"
                ? 100
                : 0);

            return (
              <Card key={task.id} className="p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="font-medium">{task.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Task ID: {task.id}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Project: {task.projectName ?? "Not assigned"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Start: {task.startDate ?? "Not set"} · Due: {task.due}
                    </div>

                    {task.pendingReason && (
                      <div className="mt-2 text-xs text-warning">
                        Pending reason: {task.pendingReason}
                      </div>
                    )}

                    {task.delayReason && (
                      <div className="mt-2 text-xs text-destructive">
                        Delay reason: {task.delayReason}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <Badge variant="outline">
                      {task.status.replaceAll("-", " ")}
                    </Badge>
                    <div className="mt-2 text-sm font-semibold">
                      {completion}%
                    </div>
                  </div>
                </div>

                <Progress className="mt-3" value={completion} />
              </Card>
            );
          })}

          {!memberTasks.length && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              No tasks have been assigned to this member.
            </div>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">
        {value || "Not available"}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}