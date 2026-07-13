import { createClient } from "@supabase/supabase-js";
import type { Activity, Approval, Department, Notification, Project, Task, User } from "@/data/mockData";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const hasPlaceholderConfig =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project-ref") ||
  supabaseAnonKey.includes("your-supabase") ||
  supabaseAnonKey.includes("your-anon");

export const supabase = !hasPlaceholderConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const isSupabaseConfigured = Boolean(supabase);
export const supabaseConfigError = hasPlaceholderConfig
  ? "Supabase is not configured. Replace VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env with your real Supabase project values, then restart the dev server."
  : "";

type WorkspaceData = {
  users: User[];
  departments: Department[];
  projects: Project[];
  tasks: Task[];
  approvals: Approval[];
  activities: Activity[];
  notifications: Notification[];
};

type SaveResult = { ok: true } | { ok: false; error: string };

function clean<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function userRow(user: User) {
  return clean({
    id: user.id,
    employee_id: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    title: user.title,
    initials: user.initials,
    manager_id: user.managerId,
    password_hash: user.passwordHash,
    raw_data: user,
  });
}

function userFromRow(row: any): User {
  return {
    id: row.id,
    employeeId: row.employee_id ?? undefined,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    title: row.title,
    initials: row.initials,
    managerId: row.manager_id ?? undefined,
    passwordHash: row.password_hash ?? undefined,
  };
}

function departmentRow(department: Department) {
  return clean({
    id: department.id,
    name: department.name,
    head_id: department.headId,
    members: department.members,
    workload: department.workload,
    active_projects: department.activeProjects,
    performance: department.performance,
    raw_data: department,
  });
}

function departmentFromRow(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    headId: row.head_id,
    members: row.members ?? 0,
    workload: row.workload ?? 0,
    activeProjects: row.active_projects ?? 0,
    performance: row.performance ?? "flat",
  };
}

function projectRow(project: Project) {
  return clean({
    id: project.id,
    name: project.name,
    description: project.description,
    owner_id: project.ownerId,
    owner: project.owner,
    department: project.department,
    progress: project.progress,
    due: project.due,
    status: project.status,
    priority: project.priority,
    team_size: project.teamSize,
    raw_data: project,
  });
}

function projectFromRow(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.owner_id ?? undefined,
    owner: row.owner,
    department: row.department,
    progress: row.progress ?? 0,
    due: row.due ?? "TBD",
    status: row.status ?? "on-track",
    priority: row.priority ?? "medium",
    teamSize: row.team_size ?? 1,
  };
}

function taskRow(task: Task) {
  return clean({
    id: task.id,
    title: task.title,
    description: task.description,
    project_id: task.projectId,
    project_name: task.projectName,
    assignee: task.assignee,
    assignee_id: task.assigneeId,
    created_by_id: task.createdById,
    reviewer_id: task.reviewerId,
    reviewer_name: task.reviewerName,
    approval_status: task.approvalStatus,
    registered_at: task.registeredAt,
    started_at: task.startedAt,
    start_date: task.startDate,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
    department: task.department,
    due: task.due,
    priority: task.priority,
    status: task.status,
    completion_percent: task.completionPercent,
    pending_reason: task.pendingReason,
    delay_reason: task.delayReason,
    review_reason: task.reviewReason,
    planned_today: task.plannedToday,
    checklist_done: task.checklistDone,
    checklist_total: task.checklistTotal,
    raw_data: task,
  });
}

function taskFromRow(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    projectId: row.project_id ?? undefined,
    projectName: row.project_name ?? undefined,
    assignee: row.assignee,
    assigneeId: row.assignee_id ?? undefined,
    createdById: row.created_by_id ?? undefined,
    reviewerId: row.reviewer_id ?? undefined,
    reviewerName: row.reviewer_name ?? undefined,
    approvalStatus: row.approval_status ?? "not-submitted",
    registeredAt: row.registered_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    startDate: row.start_date ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    department: row.department,
    due: row.due,
    priority: row.priority,
    status: row.status,
    completionPercent: row.completion_percent ?? undefined,
    pendingReason: row.pending_reason ?? undefined,
    delayReason: row.delay_reason ?? undefined,
    reviewReason: row.review_reason ?? undefined,
    plannedToday: row.planned_today ?? undefined,
    checklistDone: row.checklist_done ?? undefined,
    checklistTotal: row.checklist_total ?? undefined,
  };
}

function approvalRow(approval: Approval) {
  return clean({
    id: approval.id,
    type: approval.type,
    requester: approval.requester,
    department: approval.department,
    priority: approval.priority,
    status: approval.status,
    submitted_at: approval.submittedAt,
    amount: approval.amount,
    purpose: approval.purpose,
    task_id: approval.taskId,
    task_title: approval.taskTitle,
    project_name: approval.projectName,
    completion_percent: approval.completionPercent,
    reason: approval.reason,
    approver_name: approval.approverName,
    response: approval.response,
    responded_by: approval.respondedBy,
    responded_at: approval.respondedAt,
    raw_data: approval,
  });
}

function approvalFromRow(row: any): Approval {
  return {
    id: row.id,
    type: row.type,
    requester: row.requester,
    department: row.department,
    priority: row.priority,
    status: row.status,
    submittedAt: row.submitted_at,
    amount: row.amount ?? undefined,
    purpose: row.purpose ?? undefined,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title ?? undefined,
    projectName: row.project_name ?? undefined,
    completionPercent: row.completion_percent ?? undefined,
    reason: row.reason ?? undefined,
    approverName: row.approver_name ?? undefined,
    response: row.response ?? undefined,
    respondedBy: row.responded_by ?? undefined,
    respondedAt: row.responded_at ?? undefined,
  };
}

function activityRow(activity: Activity) {
  return clean({
    id: activity.id,
    user_name: activity.user,
    action: activity.action,
    time: activity.time,
    department: activity.department,
    project_id: activity.projectId,
    project_name: activity.projectName,
    task_id: activity.taskId,
    task_title: activity.taskTitle,
    type: activity.type,
    status: activity.status,
    raw_data: activity,
  });
}

function activityFromRow(row: any): Activity {
  return {
    id: row.id,
    user: row.user_name,
    action: row.action,
    time: row.time,
    department: row.department ?? undefined,
    projectId: row.project_id ?? undefined,
    projectName: row.project_name ?? undefined,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title ?? undefined,
    type: row.type ?? undefined,
    status: row.status ?? undefined,
  };
}

function notificationRow(notification: Notification) {
  return clean({
    id: notification.id,
    user_id: notification.userId,
    role: notification.role,
    department: notification.department,
    title: notification.title,
    body: notification.body,
    time: notification.time,
    read: notification.read,
    href: notification.href,
    raw_data: notification,
  });
}

function notificationFromRow(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    role: row.role ?? undefined,
    department: row.department ?? undefined,
    title: row.title,
    body: row.body,
    time: row.time,
    read: row.read ?? false,
    href: row.href ?? undefined,
  };
}

async function upsert(table: string, row: Record<string, unknown>): Promise<SaveResult> {
  if (!supabase) return { ok: false, error: supabaseConfigError };
  const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
  if (error) {
    console.error(`Supabase ${table} upsert failed`, error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function deleteFrom(table: string, id: string): Promise<SaveResult> {
  if (!supabase) return { ok: false, error: supabaseConfigError };
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`Supabase ${table} delete failed`, error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function loadWorkspaceFromSupabase(): Promise<WorkspaceData | null> {
  if (!supabase) return null;
  const [usersRes, departmentsRes, projectsRes, tasksRes, approvalsRes, activitiesRes, notificationsRes] = await Promise.all([
    supabase.from("pm_users").select("*").order("created_at", { ascending: true }),
    supabase.from("pm_departments").select("*").order("created_at", { ascending: true }),
    supabase.from("pm_projects").select("*").order("created_at", { ascending: true }),
    supabase.from("pm_tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("pm_approvals").select("*").order("created_at", { ascending: false }),
    supabase.from("pm_activities").select("*").order("created_at", { ascending: false }),
    supabase.from("pm_notifications").select("*").order("created_at", { ascending: false }),
  ]);

  const error = usersRes.error ?? departmentsRes.error ?? projectsRes.error ?? tasksRes.error ?? approvalsRes.error ?? activitiesRes.error ?? notificationsRes.error;
  if (error) {
    console.error("Supabase workspace load failed", error);
    return null;
  }

  return {
    users: (usersRes.data ?? []).map(userFromRow),
    departments: (departmentsRes.data ?? []).map(departmentFromRow),
    projects: (projectsRes.data ?? []).map(projectFromRow),
    tasks: (tasksRes.data ?? []).map(taskFromRow),
    approvals: (approvalsRes.data ?? []).map(approvalFromRow),
    activities: (activitiesRes.data ?? []).map(activityFromRow),
    notifications: (notificationsRes.data ?? []).map(notificationFromRow),
  };
}

export async function bootstrapSupabaseWorkspace(users: User[], departments: Department[], projects: Project[]) {
  if (!supabase) return;
  await Promise.all([
    ...users.map((user) => upsert("pm_users", userRow(user))),
    ...departments.map((department) => upsert("pm_departments", departmentRow(department))),
    ...projects.map((project) => upsert("pm_projects", projectRow(project))),
  ]);
}

export const db = {
  saveUser: (user: User) => upsert("pm_users", userRow(user)),
  saveProject: (project: Project) => upsert("pm_projects", projectRow(project)),
  saveTask: (task: Task) => upsert("pm_tasks", taskRow(task)),
  deleteTask: (id: string) => deleteFrom("pm_tasks", id),
  saveApproval: (approval: Approval) => upsert("pm_approvals", approvalRow(approval)),
  saveActivity: (activity: Activity) => upsert("pm_activities", activityRow(activity)),
  saveNotification: (notification: Notification) => upsert("pm_notifications", notificationRow(notification)),
  saveNotificationRead: (notification: Notification) => upsert("pm_notifications", notificationRow(notification)),
};
