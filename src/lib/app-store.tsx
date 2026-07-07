import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BriefcaseBusiness, LogIn } from "lucide-react";
import {
  type Task,
  type Approval,
  type Activity,
  type Notification,
  type Role,
  users as seedUsers,
  projects as seedProjects,

  initialTasks as seedTasks,

  departments as seedDepartments,
  departmentRoleOptions,
  type User,
  type Project,
} from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bootstrapSupabaseWorkspace, db, isSupabaseConfigured, loadWorkspaceFromSupabase } from "@/lib/supabase";

interface LoginForm {
  mode: "signin" | "signup";
  employeeId: string;
  name?: string;
  role: Role;
  department: string;
  title: string;
  managerId?: string;
  password: string;
}

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  currentUser: User;
  login: (profile: LoginForm) => Promise<string | null>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  users: User[];
  visibleUsers: User[];
  addUser: (u: Omit<User, "id" | "initials" | "email"> & { email?: string }) => void;
  projects: Project[];
  visibleProjects: Project[];
  addProject: (p: Omit<Project, "id" | "progress" | "status" | "teamSize"> & Partial<Pick<Project, "progress" | "status" | "teamSize">>) => Project;
  findProjectByName: (name: string) => Project | undefined;
  tasks: Task[];
  allTasks: Task[];
  addTask: (t: Omit<Task, "id">) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
  updateTaskDetails: (id: string, updates: Partial<Pick<Task, "completionPercent" | "pendingReason" | "delayReason" | "startDate" | "due">>) => void;
  submitTaskDelayReason: (id: string, reason: string) => void;
  submitTaskPendingInfo: (id: string, info: string) => void;
  submitLeaveRequest: (data: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}) => void;
  submitTaskForReview: (id: string) => void;
  approvals: Approval[];
  setApprovalStatus: (id: string, status: Approval["status"], reason?: string) => void;
  replyToApproval: (id: string, response: string) => void;
  activities: Activity[];
  addActivity: (a: Omit<Activity, "id" | "time">) => void;
  notifications: Notification[];
  unreadNotifications: Notification[];
  markNotificationRead: (id: string) => void;
  risks: { id: string; title: string; severity: "low" | "medium" | "high" }[];
  addRisk: (title: string, severity: "low" | "medium" | "high") => void;
  comments: { id: string; user: string; text: string; time: string }[];
  addComment: (text: string) => void;
}

const STORAGE_KEY = "chimertech-workspace-v9";
const Ctx = createContext<AppState | null>(null);

const ROLE_PASSWORDS = {
  admin: "admin@123",
  heads: {
    Tech: "tech@123",
    "Electronics & R&D": "electronics@123",
    "Sales & Marketing": "sales@123",
    Operations: "operations@123",
  },
};

const MEMBER_DEFAULT_PASSWORD = "user@123";
const BLOCKED_USER_NAMES = new Set(["mm", "ani", "simbi", "silambu", "poiuytr", "akil", "remo", "reena", "ravi", "aaaa"]);

function isBlockedUserName(name: string) {
  return BLOCKED_USER_NAMES.has(name.trim().toLowerCase());
}

function sanitizeUsers(users: User[] = []) {
  return users.filter((user) => !isBlockedUserName(user.name));
}

function timestamp() {
  return new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function emailFor(name: string) {
  return `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "") || "user"}@chimertech.com`;
}

function employeeNumber(id: string) {
  const match = id.match(/\d+/);
  return (match?.[0] ?? "0").padStart(3, "0");
}

function defaultEmployeeId(user: Pick<User, "id" | "role">) {
  if (user.role === "admin") return "ADM001";
  if (user.role === "head") return `HOD${employeeNumber(user.id)}`;
  return `EMP${employeeNumber(user.id)}`;
}

function normalizeEmployeeId(value: string) {
  return value.trim().toUpperCase();
}

function defaultPasswordForUser(user: User) {
  if (user.role === "admin") return ROLE_PASSWORDS.admin;
  if (user.role === "head") return ROLE_PASSWORDS.heads[user.department as keyof typeof ROLE_PASSWORDS.heads] ?? "head@123";
  return MEMBER_DEFAULT_PASSWORD;
}

function withDefaultCredentials(user: User): User {
  return { ...user, employeeId: user.employeeId ?? defaultEmployeeId(user) };
}

async function hashPassword(password: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) return `plain:${password}`;
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function headForDepartment(department: string, users = seedUsers) {
  const departmentMeta = seedDepartments.find((item) => item.name === department);
  return users.find((user) => user.id === departmentMeta?.headId) ?? users.find((user) => user.role === "head" && user.department === department);
}

function normalizeApprovalStatus(task: Task): Task["approvalStatus"] {
  if (task.approvalStatus) return task.approvalStatus;
  if (task.status === "in-review") return "pending";
  if (task.status === "approved") return "approved";
  return "not-submitted";
}

function roleOptionsFor(department: string) {
  return departmentRoleOptions[department] ?? ["Team Member"];
}

function hydrateTask(task: Task): Task {
  const assignee = seedUsers.find((u) => u.name === task.assignee);
  const project = seedProjects.find((p) => p.department === task.department);
  return {
    ...task,
    projectId: task.projectId ?? project?.id,
    projectName: task.projectName ?? project?.name,
    assigneeId: task.assigneeId ?? assignee?.id,
    createdById: task.createdById ?? "u0",
    registeredAt: task.registeredAt ?? "May 18, 2025, 09:00 AM",
    startedAt: task.startedAt ?? (task.status === "in-progress" || task.status === "in-review" ? "May 18, 2025, 10:00 AM" : undefined),
    startDate: task.startDate ?? task.registeredAt?.slice(0, 12),
    updatedAt: task.updatedAt ?? "May 18, 2025, 09:00 AM",
    completedAt: task.completedAt ?? (task.status === "completed" ? "May 18, 2025, 05:30 PM" : undefined),
    completionPercent: task.completionPercent ?? (task.status === "completed" ? 100 : task.checklistTotal ? Math.round(((task.checklistDone ?? 0) / task.checklistTotal) * 100) : 0),
    plannedToday: task.plannedToday ?? (task.status === "backlog" || task.status === "in-progress"),
    approvalStatus: normalizeApprovalStatus(task),
    reviewerId: task.reviewerId ?? headForDepartment(task.department)?.id,
    reviewerName: task.reviewerName ?? headForDepartment(task.department)?.name,
  };
}

function scopeTasks(tasks: Task[], user: User) {
  if (user.role === "admin") return tasks;
  if (user.role === "head") return tasks.filter((task) => task.department === user.department);
  return tasks.filter((task) => task.assigneeId === user.id || task.assignee === user.name);
}

function scopeUsers(users: User[], user: User) {
  if (user.role === "admin") return users;
  if (user.role === "head") return users.filter((member) => member.department === user.department || member.id === user.id);
  return users.filter((member) => member.department === user.department || member.id === user.id || member.id === user.managerId);
}

function scopeProjects(projects: Project[], user: User) {
  if (user.role === "admin") return projects;
  if (user.role === "head") return projects.filter((project) => project.department === user.department);
  return projects.filter((project) => project.department === user.department || project.owner === user.name);
}

function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function passwordMatchesUser(user: User, password: string) {
  const passwordHash = await hashPassword(password);
  return user.passwordHash
    ? user.passwordHash === passwordHash || user.passwordHash === `plain:${password}`
    : password === defaultPasswordForUser(user);
}

function LoginScreen({ onLogin }: { onLogin: (profile: LoginForm) => Promise<string | null> }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signIn, setSignIn] = useState({ employeeId: "", password: "" });
  const [form, setForm] = useState<LoginForm>({
    mode: "signup",
    employeeId: "",
    name: "",
    role: "member",
    department: "Tech",
    title: "Junior Developer",
    managerId: "u3",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const departments = seedDepartments.map((department) => department.name);
  const selectedHead = headForDepartment(form.department);
  const titleOptions = form.role === "head" ? [`${form.department} Head`] : roleOptionsFor(form.department);

  function updateDepartment(department: string) {
    const head = headForDepartment(department);
    const nextRoleOptions = roleOptionsFor(department);
    setForm({
      ...form,
      department,
      managerId: form.role === "member" ? head?.id : undefined,
      title: form.role === "head" ? `${department} Head` : nextRoleOptions[0],
      password: "",
    });
  }

  async function submitSignIn() {
    setError("");
    if (!signIn.employeeId.trim() || !signIn.password) {
      setError("Employee ID and password are required.");
      return;
    }
    setLoading(true);
    const result = await onLogin({
      mode: "signin",
      employeeId: signIn.employeeId,
      password: signIn.password,
      role: "member",
      department: "Tech",
      title: "Team Member",
    });
    setLoading(false);
    if (result) setError(result);
  }

  async function submitSignup() {
    setError("");
    if (!form.employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }
    if (!form.name?.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await onLogin({ ...form, mode: "signup", managerId: selectedHead?.id });
    setLoading(false);
    if (result) setError(result);
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-lg bg-primary grid place-items-center text-primary-foreground">
            <BriefcaseBusiness className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Chimertech Workspace Login</h1>
            <p className="text-sm text-muted-foreground">Sign in with your employee credentials.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5 rounded-lg bg-muted p-1">
          <button className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("signin")}>Sign In</button>
          <button className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("signup")}>Create Account</button>
        </div>
        <div className="space-y-4">
          {mode === "signin" ? (
            <>
              <div>
                <Label>Employee ID</Label>
                <Input value={signIn.employeeId} onChange={(event) => setSignIn({ ...signIn, employeeId: event.target.value })} placeholder="ADM001" autoComplete="username" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={signIn.password} onChange={(event) => setSignIn({ ...signIn, password: event.target.value })} placeholder="Enter password" autoComplete="current-password" />
              </div>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Employee ID</Label>
                  <Input value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: normalizeEmployeeId(event.target.value) })} placeholder="EMP030" autoComplete="username" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Create password" autoComplete="new-password" />
                </div>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter your full name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(value) => {
                    const nextRole = value as Role;
                    setForm({
                      ...form,
                      role: nextRole,
                      title: "Team Member",
                      managerId: nextRole === "member" ? selectedHead?.id : undefined,
                    });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={updateDepartment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Role / Title</Label>
                <Select value={form.title} onValueChange={(value) => setForm({ ...form, title: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{titleOptions.map((title) => <SelectItem key={title} value={title}>{title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department Head</Label>
                <Input value={selectedHead ? `${selectedHead.name} - ${selectedHead.title}` : "No head assigned"} readOnly />
              </div>
            </>
          )}
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <Button className="w-full" onClick={mode === "signin" ? submitSignIn : submitSignup} disabled={loading}>
            <LogIn className="size-4" /> {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const stored = loadState();
  const [currentUser, setCurrentUser] = useState<User | null>(stored?.currentUser && !isBlockedUserName(stored.currentUser.name) ? stored.currentUser : null);
  const [users, setUsers] = useState<User[]>(sanitizeUsers(stored?.users ?? seedUsers));
  const [projects, setProjects] = useState<Project[]>(stored?.projects ?? seedProjects);

  const [tasks, setTasks] = useState<Task[]>((stored?.tasks?.length ? stored.tasks : seedTasks).map(hydrateTask));

  const [approvals, setApprovals] = useState<Approval[]>(stored?.approvals ?? []);
  const [activities, setActivities] = useState<Activity[]>(stored?.activities ?? []);
  const [notifications, setNotifications] = useState<Notification[]>(stored?.notifications ?? []);
  const [risks, setRisks] = useState([
    { id: "r1", title: "Sensor supply delay", severity: "high" as const },
    { id: "r2", title: "Third-party API dependency", severity: "medium" as const },
    { id: "r3", title: "Firmware stability under load", severity: "low" as const },
  ]);
  const [comments, setComments] = useState([
    { id: "c1", user: "Veeramani Veerappan", text: "Sensor integration testing on track for this week.", time: "2 hrs ago" },
    { id: "c2", user: "Aishwarya Jayachandran", text: "Firmware v1.0 build artifacts uploaded.", time: "5 hrs ago" },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabase() {
      const data = await loadWorkspaceFromSupabase();
      if (!data || cancelled) return;

      if (!data.users.length && !data.projects.length) {
        const defaultUsers = sanitizeUsers(seedUsers.map(withDefaultCredentials));
        await bootstrapSupabaseWorkspace(defaultUsers, seedDepartments, seedProjects);
        if (!cancelled) {
          setUsers(defaultUsers);
          setProjects(seedProjects);
          setTasks(seedTasks.map(hydrateTask));
        }
        return;
      }

      if (!cancelled) {
        setUsers(sanitizeUsers((data.users.length ? data.users : seedUsers).map(withDefaultCredentials)));
        setProjects(data.projects.length ? data.projects : seedProjects);
        setTasks((data.tasks.length ? data.tasks : seedTasks).map(hydrateTask));
      }

      setApprovals(data.approvals);
      setActivities(data.activities);
      setNotifications(data.notifications);
    }

    void loadDatabase();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const safeCurrentUser = currentUser && !isBlockedUserName(currentUser.name) ? currentUser : null;
    const safeUsers = sanitizeUsers(users);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentUser: safeCurrentUser, users: safeUsers, projects, tasks, approvals, activities, notifications }));
  }, [currentUser, users, projects, tasks, approvals, activities, notifications]);

  const visibleTasks = useMemo(() => (currentUser ? scopeTasks(tasks, currentUser) : []), [tasks, currentUser]);
  const visibleUsers = useMemo(() => (currentUser ? scopeUsers(users, currentUser) : []), [users, currentUser]);
  const visibleProjects = useMemo(() => (currentUser ? scopeProjects(projects, currentUser) : []), [projects, currentUser]);
  const visibleApprovals = useMemo(() => {
  if (!currentUser) return [];

  if (currentUser.role === "admin") {
    return approvals;
  }

  if (currentUser.role === "head") {
    return approvals.filter((approval) => {
      if (approval.type === "Leave Request") {
        return approval.department === currentUser.department || approval.requester === currentUser.name;
      }

      return (
        approval.department === currentUser.department ||
        approval.approverName === currentUser.name ||
        approval.requester === currentUser.name
      );
    });
  }

  return approvals.filter((approval) => approval.requester === currentUser.name);
}, [approvals, currentUser]);
  const visibleActivities = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return activities;
    if (currentUser.role === "head") return activities.filter((activity) => activity.department === currentUser.department || activity.user === currentUser.name);
    return activities.filter((activity) => activity.user === currentUser.name);
  }, [activities, currentUser]);
  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((notification) =>
      notification.userId === currentUser.id ||
      notification.role === currentUser.role ||
      (notification.department === currentUser.department && (currentUser.role === "head" || notification.role !== "head"))
    );
  }, [notifications, currentUser]);

  function addStoredActivity(activity: Omit<Activity, "id" | "time">) {
    const newActivity = { ...activity, id: `a-${Date.now()}`, time: "Just now" };
    setActivities((previous) => [newActivity, ...previous]);
    void db.saveActivity(newActivity);
  }

  function notify(notification: Omit<Notification, "id" | "time" | "read">) {
    const newNotification = { ...notification, id: `n-${Date.now()}`, time: "Just now", read: false };
    setNotifications((previous) => [newNotification, ...previous]);
    void db.saveNotification(newNotification);
  }

  async function login(profile: LoginForm) {
    const employeeId = normalizeEmployeeId(profile.employeeId);

    if (profile.mode === "signin") {
      const existing = users.map(withDefaultCredentials).find((user) => normalizeEmployeeId(user.employeeId ?? "") === employeeId);
      if (!existing) return "Employee ID was not found.";

      const passwordHash = await hashPassword(profile.password);
      const validPassword = await passwordMatchesUser(existing, profile.password);

      if (!validPassword) return "Password is incorrect.";

      const user = { ...existing, employeeId, passwordHash: existing.passwordHash ?? passwordHash };
      setUsers((previous) => previous.map((item) => item.id === user.id ? user : item));
      if (isSupabaseConfigured) {
        const saveResult = await db.saveUser(user);
        if (!saveResult.ok) return `Account was not saved in Supabase: ${saveResult.error}`;
      }
      setCurrentUser(user);
      addStoredActivity({ user: user.name, action: "logged in to the workspace", department: user.department, type: "login" });
      return null;
    }

    if (users.some((user) => normalizeEmployeeId(user.employeeId ?? "") === employeeId)) {
      return "Employee ID already exists.";
    }

    const name = profile.name?.trim() ?? "";
    const user: User = {
      id: `u-${Date.now()}`,
      employeeId,
      name,
      email: emailFor(name),
      role: "member",
      department: profile.department,
      title: profile.title || "Team Member",
      initials: initials(name),
      managerId: profile.managerId ?? headForDepartment(profile.department, users)?.id,
      passwordHash: await hashPassword(profile.password),
    };

    if (isSupabaseConfigured) {
      const saveResult = await db.saveUser(user);
      if (!saveResult.ok) return `Account was not saved in Supabase: ${saveResult.error}`;
    }

    setUsers((previous) => [user, ...previous]);
    setCurrentUser(user);
    addStoredActivity({ user: user.name, action: "created an employee account and logged in", department: user.department, type: "login" });
    return null;
  }

  if (!currentUser) return <LoginScreen onLogin={login} />;

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!currentUser) return { ok: false, message: "You need to be signed in to change your password." };
    if (!currentPassword.trim()) return { ok: false, message: "Please enter your current password." };
    if (!newPassword || newPassword.length < 6) return { ok: false, message: "New password must be at least 6 characters." };

    const currentMatches = await passwordMatchesUser(currentUser, currentPassword);
    if (!currentMatches) return { ok: false, message: "Current password is incorrect." };

    const passwordHash = await hashPassword(newPassword);
    const updatedUser = { ...currentUser, passwordHash };

    setUsers((previous) => previous.map((user) => user.id === currentUser.id ? updatedUser : user));
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured) {
      const saveResult = await db.saveUser(updatedUser);
      if (!saveResult.ok) return { ok: false, message: `Password could not be saved: ${saveResult.error}` };
    }

    addStoredActivity({ user: updatedUser.name, action: "updated account password", department: updatedUser.department, type: "login" });
    return { ok: true, message: "Password updated successfully. Your new password is now active." };
  }

  const value: AppState = {
    role: currentUser.role,
    setRole: (role) => setCurrentUser((user) => user ? { ...user, role } : user),
    currentUser,
    login,
    updatePassword,
    logout: () => {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
      setCurrentUser(null);
    },
    users,
    visibleUsers,
    addUser: () => {
      addStoredActivity({ user: currentUser.name, action: "attempted to add a user outside the preconfigured accounts", department: currentUser.department, type: "user" });
    },
    projects,
    visibleProjects,
    addProject: (project) => {
      const newProject: Project = {
        ...project,
        id: `p-${Date.now()}`,
        progress: project.progress ?? 0,
        status: project.status ?? "on-track",
        teamSize: project.teamSize ?? 1,
      };
      setProjects((previous) => [newProject, ...previous]);
      void db.saveProject(newProject);
      addStoredActivity({ user: currentUser.name, action: `created project "${newProject.name}"`, department: newProject.department, projectId: newProject.id, projectName: newProject.name, type: "project" });
      return newProject;
    },
    findProjectByName: (name) => projects.find((project) => project.name.trim().toLowerCase() === name.trim().toLowerCase()),
    tasks: visibleTasks,
    allTasks: tasks,
    addTask: (task) => {
      const assignee = users.find((user) => user.id === task.assigneeId || user.name === task.assignee);
      const project = projects.find((item) => item.id === task.projectId || item.name.trim().toLowerCase() === task.projectName?.trim().toLowerCase());
      if (!project) throw new Error("Create or select a project before adding a task.");
      const reviewer = task.reviewerId
        ? users.find((user) => user.id === task.reviewerId)
        : headForDepartment(project.department, users);
      const newTask: Task = {
        ...task,
        id: `t-${Date.now()}`,
        projectId: project.id,
        projectName: project.name,
        assignee: assignee?.name ?? task.assignee,
        assigneeId: assignee?.id ?? task.assigneeId,
        department: project.department,
        createdById: currentUser.id,
        reviewerId: reviewer?.id,
        reviewerName: reviewer?.name,
        approvalStatus: task.approvalStatus ?? "not-submitted",
        registeredAt: task.registeredAt ?? timestamp(),
        startDate: task.startDate ?? new Date().toISOString().slice(0, 10),
        startedAt: task.status === "in-progress" || task.status === "in-review" ? (task.startedAt ?? timestamp()) : task.startedAt,
        updatedAt: timestamp(),
        completedAt: task.status === "completed" ? (task.completedAt ?? timestamp()) : task.completedAt,
        completionPercent: task.status === "completed" ? 100 : (task.completionPercent ?? 0),
      };
      setTasks((previous) => [newTask, ...previous]);
      void db.saveTask(newTask);
      addStoredActivity({ user: currentUser.name, action: `created task "${task.title}"`, department: project.department, projectId: project.id, projectName: project.name, taskId: newTask.id, taskTitle: newTask.title, type: "task", status: newTask.status });
      if (assignee?.id && assignee.id !== currentUser.id) {
        notify({ userId: assignee.id, title: "New task assigned", body: `${currentUser.name} assigned "${newTask.title}"`, href: "/tasks" });
      }
      if (reviewer?.id) {
        notify({ userId: reviewer.id, role: "head", department: project.department, title: "Task created", body: `${newTask.title} was created in ${project.name}`, href: "/tasks" });
      }
      notify({ role: "admin", title: "Task created", body: `${currentUser.name} created "${newTask.title}"`, href: "/tasks" });
    },
    updateTaskStatus: (id, status) => {
      setTasks((previous) => previous.map((task) => {
        if (task.id !== id) return task;
        const updatedTask = {
          ...task,
          status,
          completionPercent: status === "completed" ? 100 : task.completionPercent,
          updatedAt: timestamp(),
          startedAt: status === "in-progress" || status === "in-review" ? (task.startedAt ?? timestamp()) : task.startedAt,
          completedAt: status === "completed" ? timestamp() : undefined,
        };
        void db.saveTask(updatedTask);
        return updatedTask;
      }));
      const task = tasks.find((item) => item.id === id);
      addStoredActivity({ user: currentUser.name, action: `moved "${task?.title ?? "a task"}" to ${status.replace("-", " ")}`, department: task?.department, projectId: task?.projectId, projectName: task?.projectName, taskId: id, taskTitle: task?.title, type: "status", status });
    },
    updateTaskDetails: (id, updates) => {
      setTasks((previous) => previous.map((task) => {
        if (task.id !== id) return task;
        const completionPercent = updates.completionPercent ?? task.completionPercent ?? 0;
        const nextStatus: Task["status"] = completionPercent >= 100
          ? "completed"
          : completionPercent > 0
            ? "in-progress"
            : task.status === "completed"
              ? "backlog"
              : task.status;

        const updatedTask = {
          ...task,
          ...updates,
          completionPercent,
          status: nextStatus,
          updatedAt: timestamp(),
          startedAt: nextStatus === "in-progress" || nextStatus === "in-review" ? (task.startedAt ?? timestamp()) : task.startedAt,
          completedAt: nextStatus === "completed" ? (task.completedAt ?? timestamp()) : undefined,
        };
        void db.saveTask(updatedTask);
        return updatedTask;
      }));
      const task = tasks.find((item) => item.id === id);
      addStoredActivity({ user: currentUser.name, action: `updated progress for "${task?.title ?? "a task"}"`, department: task?.department, projectId: task?.projectId, projectName: task?.projectName, taskId: id, taskTitle: task?.title, type: "task", status: updates.completionPercent !== undefined ? `${updates.completionPercent}%` : task?.status });
    },
    submitTaskDelayReason: (id, reason) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      const approver = headForDepartment(task.department, users);
      const requestId = `TDR-${Date.now()}`;
      setTasks((previous) => previous.map((item) => {
        if (item.id !== id) return item;
        const updatedTask = { ...item, delayReason: reason, updatedAt: timestamp() };
        void db.saveTask(updatedTask);
        return updatedTask;
      }));
      const newApproval: Approval = {
        id: requestId,
        type: "Task Delay Reason",
        requester: currentUser.name,
        department: task.department,
        priority: task.priority,
        status: "pending",
        submittedAt: timestamp(),
        purpose: `Delay reason submitted for ${task.title}`,
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.projectName,
        completionPercent: task.completionPercent ?? 0,
        reason,
        approverName: approver?.name,
      };
      setApprovals((previous) => [newApproval, ...previous]);
      void db.saveApproval(newApproval);
      addStoredActivity({ user: currentUser.name, action: `submitted delay reason for "${task.title}"`, department: task.department, projectId: task.projectId, projectName: task.projectName, taskId: task.id, taskTitle: task.title, type: "approval", status: "pending" });
    },
    submitTaskPendingInfo: (id, info) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      const approver = headForDepartment(task.department, users);
      setTasks((previous) => previous.map((item) => {
        if (item.id !== id) return item;
        const updatedTask = { ...item, pendingReason: info, updatedAt: timestamp() };
        void db.saveTask(updatedTask);
        return updatedTask;
      }));
      const newApproval: Approval = {
        id: `TPI-${Date.now()}`,
        type: "Task Pending Info",
        requester: currentUser.name,
        department: task.department,
        priority: task.priority,
        status: "pending",
        submittedAt: timestamp(),
        purpose: `Pending task information submitted for ${task.title}`,
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.projectName,
        completionPercent: task.completionPercent ?? 0,
        reason: info,
        approverName: approver?.name,
      };
      setApprovals((previous) => [newApproval, ...previous]);
      void db.saveApproval(newApproval);
      addStoredActivity({ user: currentUser.name, action: `sent pending info for "${task.title}"`, department: task.department, projectId: task.projectId, projectName: task.projectName, taskId: task.id, taskTitle: task.title, type: "approval", status: "pending" });
    },
    submitLeaveRequest: (data) => {
  const approver = headForDepartment(currentUser.department, users);

  const newApproval: Approval = {
    id: `LR-${Date.now()}`,
    type: "Leave Request",
    requester: currentUser.name,
    department: currentUser.department,
    priority: "medium",
    status: "pending",
    submittedAt: timestamp(),
    purpose: `${data.leaveType} from ${data.startDate} to ${data.endDate}`,
    reason: data.reason,
    approverName:
      currentUser.role === "head"
        ? "Admin"
        : approver?.name ?? "Team Head",
  };

  setApprovals((previous) => [newApproval, ...previous]);
  void db.saveApproval(newApproval);

  addStoredActivity({
    user: currentUser.name,
    action: `submitted ${data.leaveType} leave request`,
    department: currentUser.department,
    type: "approval",
    status: "pending",
  });

  if (currentUser.role === "head") {
    notify({
      role: "admin",
      title: "Head leave request",
      body: `${currentUser.name} submitted a leave request`,
      href: "/approvals",
    });
  } else {
    if (approver?.id) {
      notify({
        userId: approver.id,
        role: "head",
        department: currentUser.department,
        title: "Leave request pending",
        body: `${currentUser.name} submitted a leave request`,
        href: "/approvals",
      });
    }

    notify({
      role: "admin",
      title: "Leave request pending",
      body: `${currentUser.name} submitted a leave request`,
      href: "/approvals",
    });
  }
},
    submitTaskForReview: (id) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      const approver = task.reviewerId ? users.find((user) => user.id === task.reviewerId) : headForDepartment(task.department, users);
      const approvalId = `TA-${Date.now()}`;
      setTasks((previous) => previous.map((item) => {
        if (item.id !== id) return item;
        const updatedTask = { ...item, status: "in-review" as const, approvalStatus: "pending" as const, reviewerId: approver?.id, reviewerName: approver?.name, updatedAt: timestamp() };
        void db.saveTask(updatedTask);
        return updatedTask;
      }));
      const newApproval: Approval = {
        id: approvalId,
        type: "Task Approval",
        requester: currentUser.name,
        department: task.department,
        priority: task.priority,
        status: "pending",
        submittedAt: timestamp(),
        purpose: `Review submitted task "${task.title}"`,
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.projectName,
        completionPercent: task.completionPercent ?? (task.status === "completed" ? 100 : 0),
        approverName: approver?.name,
      };
      setApprovals((previous) => [newApproval, ...previous]);
      void db.saveApproval(newApproval);
      addStoredActivity({ user: currentUser.name, action: `submitted "${task.title}" for review`, department: task.department, projectId: task.projectId, projectName: task.projectName, taskId: task.id, taskTitle: task.title, type: "approval", status: "pending" });
      if (approver?.id) notify({ userId: approver.id, role: "head", department: task.department, title: "Task pending review", body: `${currentUser.name} submitted "${task.title}"`, href: "/approvals" });
      notify({ role: "admin", title: "Task submitted for review", body: `${currentUser.name} submitted "${task.title}"`, href: "/approvals" });
    },
    approvals: visibleApprovals,
    setApprovalStatus: (id, status, reason) => {
      const approval = approvals.find((item) => item.id === id);
      if (approval?.type === "Leave Request" && currentUser.role !== "admin") {
        return;
      }
      setApprovals((previous) => previous.map((item) => {
        if (item.id !== id) return item;
        const updatedApproval = { ...item, status, response: reason ?? item.response, respondedBy: currentUser.name, respondedAt: timestamp() };
        void db.saveApproval(updatedApproval);
        return updatedApproval;
      }));
      if (approval?.taskId) {
        const nextTaskStatus: Task["status"] = status === "approved" ? "approved" : status === "changes" ? "changes" : status === "rejected" ? "blocked" : "in-review";
        const nextApprovalStatus: Task["approvalStatus"] = status === "approved" ? "approved" : status === "changes" ? "changes" : status === "rejected" ? "rejected" : "pending";
        setTasks((previous) => previous.map((task) => {
          if (task.id !== approval.taskId) return task;
          const updatedTask = {
            ...task,
            status: nextTaskStatus,
            approvalStatus: nextApprovalStatus,
            reviewReason: reason,
            completionPercent: status === "approved" ? 100 : task.completionPercent,
            completedAt: status === "approved" ? timestamp() : task.completedAt,
            updatedAt: timestamp(),
          };
          void db.saveTask(updatedTask);
          return updatedTask;
        }));
      }
      addStoredActivity({ user: currentUser.name, action: `${status === "approved" ? "approved" : status === "rejected" ? "rejected" : status === "changes" ? "requested changes on" : "updated"} "${approval?.taskTitle ?? approval?.type ?? "approval"}"`, department: approval?.department, projectName: approval?.projectName, taskId: approval?.taskId, taskTitle: approval?.taskTitle, type: "approval", status });
      const requester = users.find((user) => user.name === approval?.requester);
      if (requester?.id) notify({ userId: requester.id, title: "Approval updated", body: `${approval?.type} is ${status}`, href: approval?.taskId ? "/tasks" : "/approvals" });
      notify({ role: "admin", title: "Approval completed", body: `${currentUser.name} marked ${approval?.type ?? "approval"} ${status}`, href: "/approvals" });
    },
    replyToApproval: (id, response) => {
      setApprovals((previous) => previous.map((approval) => {
        if (approval.id !== id) return approval;
        const updatedApproval = {
          ...approval,
          response,
          respondedBy: currentUser.name,
          respondedAt: timestamp(),
        };
        void db.saveApproval(updatedApproval);
        return updatedApproval;
      }));
      const approval = approvals.find((item) => item.id === id);
      addStoredActivity({ user: currentUser.name, action: "replied to a task approval request", department: approval?.department, projectName: approval?.projectName, taskId: approval?.taskId, taskTitle: approval?.taskTitle, type: "approval" });
    },
    activities: visibleActivities,
    addActivity: addStoredActivity,
    notifications: visibleNotifications,
    unreadNotifications: visibleNotifications.filter((notification) => !notification.read),
    markNotificationRead: (id) => setNotifications((previous) => previous.map((notification) => {
      if (notification.id !== id) return notification;
      const updatedNotification = { ...notification, read: true };
      void db.saveNotificationRead(updatedNotification);
      return updatedNotification;
    })),
    risks,
    addRisk: (title, severity) => setRisks((previous) => [...previous, { id: `r-${Date.now()}`, title, severity }]),
    comments,
    addComment: (text) =>
      setComments((previous) => [{ id: `c-${Date.now()}`, user: currentUser.name, text, time: "Just now" }, ...previous]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
