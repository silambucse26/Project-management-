import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, CheckCircle2, FolderKanban, ShieldCheck, UserCheck, Users } from "lucide-react";
import { departments as departmentSeed } from "@/data/mockData";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/departments")({ component: DepartmentsPage });

const permissions = [
  { p: "Assign Tasks", admin: "Full", head: "Department", member: "No" },
  { p: "Approve Tasks", admin: "Full", head: "Department", member: "No" },
  { p: "Edit Projects", admin: "Full", head: "Department", member: "No" },
  { p: "View Analytics", admin: "Full", head: "Department", member: "Own work" },
  { p: "Manage Members", admin: "Full", head: "Department", member: "No" },
  { p: "Manage Departments", admin: "Full", head: "No", member: "No" },
  { p: "System Settings", admin: "Full", head: "No", member: "No" },
];

function DepartmentsPage() {
  const { role, currentUser, users, visibleUsers, allTasks, visibleProjects } = useApp();
  const scopedDepartments = useMemo(() => {
    if (role === "admin") return departmentSeed;
    return departmentSeed.filter((department) => department.name === currentUser.department);
  }, [role, currentUser.department]);
  const [selectedDepartment, setSelectedDepartment] = useState(scopedDepartments[0]?.name ?? currentUser.department);
  const selectedMeta = scopedDepartments.find((department) => department.name === selectedDepartment) ?? scopedDepartments[0];
  const adminUser = users.find((user) => user.role === "admin");
  const departmentUsers = users.filter((user) => user.department === selectedDepartment);
  const departmentHead = departmentUsers.find((user) => user.role === "head");
  const departmentMembers = departmentUsers.filter((user) => user.role === "member");
  const departmentTasks = allTasks.filter((task) => task.department === selectedDepartment);
  const departmentProjects = visibleProjects.filter((project) => project.department === selectedDepartment);
  const completed = departmentTasks.filter((task) => task.status === "completed").length;
  const inProgress = departmentTasks.filter((task) => task.status === "in-progress" || task.status === "in-review").length;
  const blocked = departmentTasks.filter((task) => task.status === "blocked").length;
  const completion = departmentTasks.length ? Math.round((completed / departmentTasks.length) * 100) : 0;

  const cards = scopedDepartments.map((department) => {
    const deptUsers = users.filter((user) => user.department === department.name);
    const deptTasks = allTasks.filter((task) => task.department === department.name);
    const deptDone = deptTasks.filter((task) => task.status === "completed").length;
    return {
      ...department,
      users: deptUsers.length,
      tasks: deptTasks.length,
      done: deptDone,
      progress: deptTasks.length ? Math.round((deptDone / deptTasks.length) * 100) : 0,
    };
  });

  function taskCountFor(name: string) {
    const assigned = allTasks.filter((task) => task.assignee === name);
    return {
      total: assigned.length,
      done: assigned.filter((task) => task.status === "completed").length,
      active: assigned.filter((task) => task.status !== "completed").length,
    };
  }

  return (
    <AppLayout title="Departments & Access" badge="Org" subtitle={role === "admin" ? "Real team hierarchy, access, and task load" : `${currentUser.department} team access`}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Total Users</div>
          <div className="text-2xl font-bold mt-1">{visibleUsers.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Department Heads</div>
          <div className="text-2xl font-bold mt-1">{visibleUsers.filter((user) => user.role === "head").length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Team Members</div>
          <div className="text-2xl font-bold mt-1">{visibleUsers.filter((user) => user.role === "member").length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground">Departments</div>
          <div className="text-2xl font-bold mt-1">{scopedDepartments.length}</div>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Departments Overview</h2>
          <Badge variant="outline">Click a department to view team details</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((department) => (
            <button key={department.id} type="button" onClick={() => setSelectedDepartment(department.name)} className="text-left">
              <Card className={`p-5 h-full hover:shadow-md transition-shadow ${selectedDepartment === department.name ? "ring-2 ring-primary" : ""}`}>
                <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-3"><Building2 className="size-5" /></div>
                <div className="font-semibold">{department.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Users className="size-3" />{department.users} users</div>
                <div className="mt-3"><Progress value={department.progress} className="h-1.5" /></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="text-muted-foreground">Tasks</div><div className="font-semibold">{department.tasks}</div></div>
                  <div><div className="text-muted-foreground">Done</div><div className="font-semibold text-success">{department.done}</div></div>
                  <div><div className="text-muted-foreground">Progress</div><div className="font-semibold">{department.progress}%</div></div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Organization Hierarchy</h3>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <div className="text-xs text-primary font-medium">ADMIN</div>
              <div className="font-semibold">{adminUser?.name ?? "Dr. Ragul"}</div>
              <div className="text-xs text-muted-foreground">Super Administrator</div>
            </div>
            <div className="text-center text-muted-foreground text-xs">down</div>
            {departmentHead && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10"><AvatarFallback className="bg-purple/15 text-purple text-xs">{departmentHead.initials}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-semibold">{departmentHead.name}</div>
                      <div className="text-xs text-muted-foreground">{departmentHead.title} - {departmentHead.department}</div>
                    </div>
                  </div>
                  <Badge variant="outline">Head</Badge>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {departmentMembers.map((member) => {
                const counts = taskCountFor(member.name);
                return (
                  <div key={member.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-9"><AvatarFallback className="bg-muted text-xs">{member.initials}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.title}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-xs">
                      <div><div className="text-muted-foreground">Tasks</div><div className="font-semibold">{counts.total}</div></div>
                      <div><div className="text-muted-foreground">Active</div><div className="font-semibold text-info">{counts.active}</div></div>
                      <div><div className="text-muted-foreground">Done</div><div className="font-semibold text-success">{counts.done}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">{selectedMeta?.name ?? selectedDepartment} Summary</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3"><FolderKanban className="size-4 text-primary mb-2" /><div className="text-2xl font-bold">{departmentProjects.length}</div><div className="text-xs text-muted-foreground">Projects</div></div>
              <div className="rounded-lg bg-muted/50 p-3"><Users className="size-4 text-success mb-2" /><div className="text-2xl font-bold">{departmentUsers.length}</div><div className="text-xs text-muted-foreground">Users</div></div>
              <div className="rounded-lg bg-muted/50 p-3"><CheckCircle2 className="size-4 text-success mb-2" /><div className="text-2xl font-bold">{completed}</div><div className="text-xs text-muted-foreground">Completed</div></div>
              <div className="rounded-lg bg-muted/50 p-3"><UserCheck className="size-4 text-warning mb-2" /><div className="text-2xl font-bold">{inProgress}</div><div className="text-xs text-muted-foreground">In Progress</div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span>Completion</span><span>{completion}%</span></div>
              <Progress value={completion} />
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Blocked Tasks</div>
              <div className="text-2xl font-bold text-destructive mt-1">{blocked}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Full Team Details - {selectedDepartment}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Tasks</th>
                <th className="py-2 px-3">Completed</th>
                <th className="py-2 px-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {departmentUsers.map((user) => {
                const counts = taskCountFor(user.name);
                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 px-3 font-medium">{user.name}</td>
                    <td className="py-3 px-3"><Badge variant="outline">{user.role}</Badge></td>
                    <td className="py-3 px-3">{user.title}</td>
                    <td className="py-3 px-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-3">{counts.total}</td>
                    <td className="py-3 px-3 text-success">{counts.done}</td>
                    <td className="py-3 px-3 text-info">{counts.active}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 px-3">Permission</th>
                <th className="py-2 px-3">Admin</th>
                <th className="py-2 px-3">Dept Head</th>
                <th className="py-2 px-3">Team Member</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.p} className="border-b last:border-0">
                  <td className="py-3 px-3 font-medium">{permission.p}</td>
                  <td className="py-3 px-3"><ShieldCheck className="size-4 text-success inline mr-1" />{permission.admin}</td>
                  <td className="py-3 px-3">{permission.head}</td>
                  <td className="py-3 px-3">{permission.member}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
