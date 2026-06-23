export type Role = "admin" | "head" | "member";

export interface User {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  title: string;
  initials: string;
  managerId?: string;
  passwordHash?: string;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  members: number;
  workload: number;
  activeProjects: number;
  performance: "up" | "down" | "flat";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  owner: string;
  department: string;
  progress: number;
  due: string;
  status: "on-track" | "at-risk" | "delayed" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  teamSize: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  assignee: string;
  assigneeId?: string;
  createdById?: string;
  reviewerId?: string;
  reviewerName?: string;
  approvalStatus?: "not-submitted" | "pending" | "approved" | "rejected" | "changes";
  registeredAt?: string;
  startedAt?: string;
  startDate?: string;
  updatedAt?: string;
  completedAt?: string;
  department: string;
  due: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "in-progress" | "in-review" | "blocked" | "changes" | "completed" | "approved";
  completionPercent?: number;
  pendingReason?: string;
  delayReason?: string;
  reviewReason?: string;
  plannedToday?: boolean;
  checklistDone?: number;
  checklistTotal?: number;
}

export interface Approval {
  id: string;
  type: string;
  requester: string;
  department: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "changes" | "escalated";
  submittedAt: string;
  amount?: number;
  purpose?: string;
  taskId?: string;
  taskTitle?: string;
  projectName?: string;
  completionPercent?: number;
  reason?: string;
  approverName?: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  department?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  type?: string;
  status?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  role?: Role;
  department?: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
}

export const departmentRoleOptions: Record<string, string[]> = {
  "Sales & Marketing": ["Sales Executive", "Marketing Executive", "Digital Marketer", "Designer", "Content Specialist", "Campaign Coordinator"],
  Tech: ["Junior Developer", "Senior Developer", "Testing Engineer", "UI/UX Designer", "Full Stack Developer", "DevOps Engineer"],
  "Electronics & R&D": ["Embedded Engineer", "R&D Engineer", "Hardware Technician", "Firmware Developer", "Electronics Testing Engineer"],
  Operations: ["Operations Executive", "Operations Manager", "Process Coordinator", "Logistics Coordinator", "Admin Coordinator"],
};

export const users: User[] = [
  { id: "u0", name: "Dr. Ragul", email: "ragul@chimertech.com", role: "admin", department: "Founder's Office", title: "Super Administrator", initials: "DR" },
  { id: "u3", name: "Siddarth Pa", email: "siddarth.pa@chimertech.com", role: "head", department: "Tech", title: "Tech Head", initials: "SP" },
  { id: "u2", name: "Veeramani Veerappan", email: "veeramani.veerappan@chimertech.com", role: "head", department: "Electronics & R&D", title: "Electronics & R&D Head", initials: "VV" },
  { id: "u4", name: "Adi Narayanan", email: "adi.narayanan@chimertech.com", role: "head", department: "Sales & Marketing", title: "Sales & Marketing Head", initials: "AN" },
  { id: "u5", name: "Shahnavas Begam", email: "shahnavas.begam@chimertech.com", role: "head", department: "Operations", title: "Operations Head", initials: "SB" },
  { id: "u10", name: "Kaviyadharshini", email: "kaviyadharshini@chimertech.com", role: "member", department: "Tech", title: "Junior Developer", initials: "KA", managerId: "u3" },
  { id: "u11", name: "Simpson J", email: "simpson.j@chimertech.com", role: "member", department: "Tech", title: "Junior Developer", initials: "SJ", managerId: "u3" },
  { id: "u12", name: "Praveena Raja", email: "praveena.raja@chimertech.com", role: "member", department: "Tech", title: "Junior Developer", initials: "PR", managerId: "u3" },
  { id: "u13", name: "Hari Prakash", email: "hari.prakash@chimertech.com", role: "member", department: "Tech", title: "Junior Developer", initials: "HP", managerId: "u3" },
  { id: "u14", name: "Aishwarya Jayachandran", email: "aishwarya.jayachandran@chimertech.com", role: "member", department: "Electronics & R&D", title: "R&D Engineer", initials: "AJ", managerId: "u2" },
  { id: "u15", name: "Partiban", email: "partiban@chimertech.com", role: "member", department: "Electronics & R&D", title: "R&D Engineer", initials: "PA", managerId: "u2" },
  { id: "u16", name: "Priyanka A", email: "priyanka.a@chimertech.com", role: "member", department: "Electronics & R&D", title: "R&D Engineer", initials: "PA", managerId: "u2" },
  { id: "u17", name: "Silambarasan", email: "silambarasan@chimertech.com", role: "member", department: "Electronics & R&D", title: "R&D Engineer", initials: "SI", managerId: "u2" },
  { id: "u18", name: "Sukvinthar Singh", email: "sukvinthar.singh@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "SS", managerId: "u4" },
  { id: "u19", name: "Visali Perumal", email: "visali.perumal@chimertech.com", role: "member", department: "Sales & Marketing", title: "Marketing Executive", initials: "VP", managerId: "u4" },
  { id: "u20", name: "Immanuel Dominic L", email: "immanuel.dominic.l@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "ID", managerId: "u4" },
  { id: "u21", name: "Praveen K", email: "praveen.k@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "PK", managerId: "u4" },
  { id: "u22", name: "Shapna Palani", email: "shapna.palani@chimertech.com", role: "member", department: "Sales & Marketing", title: "Marketing Executive", initials: "SP", managerId: "u4" },
  { id: "u23", name: "Fairzauddin", email: "fairzauddin@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "FA", managerId: "u4" },
  { id: "u24", name: "Abdul Kalam", email: "abdul.kalam@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "AK", managerId: "u4" },
  { id: "u25", name: "Priya Manikanda", email: "priya.manikanda@chimertech.com", role: "member", department: "Sales & Marketing", title: "Marketing Executive", initials: "PM", managerId: "u4" },
  { id: "u26", name: "Kesavan", email: "kesavan@chimertech.com", role: "member", department: "Sales & Marketing", title: "Sales Executive", initials: "KE", managerId: "u4" },
  { id: "u27", name: "N Revathi", email: "n.revathi@chimertech.com", role: "member", department: "Operations", title: "Operations Executive", initials: "NR", managerId: "u5" },
  { id: "u28", name: "Mamtha K", email: "mamtha.k@chimertech.com", role: "member", department: "Operations", title: "Operations Executive", initials: "MK", managerId: "u5" },
  { id: "u29", name: "Praveen V", email: "praveen.v@chimertech.com", role: "member", department: "Operations", title: "Operations Executive", initials: "PV", managerId: "u5" },
];

export const departments: Department[] = [
  { id: "d1", name: "Tech", headId: "u3", members: 5, workload: 68, activeProjects: 5, performance: "flat" },
  { id: "d2", name: "Electronics & R&D", headId: "u2", members: 5, workload: 65, activeProjects: 6, performance: "up" },
  { id: "d3", name: "Sales & Marketing", headId: "u4", members: 10, workload: 60, activeProjects: 3, performance: "flat" },
  { id: "d4", name: "Operations", headId: "u5", members: 4, workload: 62, activeProjects: 3, performance: "up" },
];

export const projects: Project[] = [
  { id: "p1", name: "NIRAMM Sensor Development", owner: "Veeramani Veerappan", ownerId: "u2", department: "Electronics & R&D", progress: 78, due: "May 30, 2025", status: "on-track", priority: "high", teamSize: 5 },
  { id: "p2", name: "iHerd App Release", owner: "Siddarth Pa", ownerId: "u3", department: "Tech", progress: 65, due: "May 24, 2025", status: "on-track", priority: "high", teamSize: 5 },
  { id: "p3", name: "MetaPashu Platform", owner: "Veeramani Veerappan", ownerId: "u2", department: "Electronics & R&D", progress: 52, due: "Jun 05, 2025", status: "at-risk", priority: "high", teamSize: 5 },
  { id: "p4", name: "CMT Batch Production", owner: "Shahnavas Begam", ownerId: "u5", department: "Operations", progress: 38, due: "May 20, 2025", status: "at-risk", priority: "critical", teamSize: 4 },
  { id: "p5", name: "FineKine Packaging Redesign", owner: "Adi Narayanan", ownerId: "u4", department: "Sales & Marketing", progress: 71, due: "May 29, 2025", status: "on-track", priority: "medium", teamSize: 10 },
  { id: "p6", name: "Operations SOP Rollout", owner: "Shahnavas Begam", ownerId: "u5", department: "Operations", progress: 42, due: "May 18, 2025", status: "delayed", priority: "high", teamSize: 4 },
  { id: "p7", name: "Digital Campaign Q3", owner: "Adi Narayanan", ownerId: "u4", department: "Sales & Marketing", progress: 100, due: "May 10, 2025", status: "completed", priority: "medium", teamSize: 10 },
  { id: "p8", name: "Electronics Validation Program", owner: "Veeramani Veerappan", ownerId: "u2", department: "Electronics & R&D", progress: 60, due: "May 28, 2025", status: "on-track", priority: "high", teamSize: 5 },
];

export const initialTasks: Task[] = [
  { id: "t1", projectId: "p1", projectName: "NIRAMM Sensor Development", title: "Research next-gen biomarker platforms", assignee: "Aishwarya Jayachandran", assigneeId: "u14", department: "Electronics & R&D", due: "May 22", priority: "medium", status: "backlog", checklistDone: 0, checklistTotal: 4 },
  { id: "t2", projectId: "p2", projectName: "iHerd App Release", title: "Build onboarding flow v2 for mobile app", assignee: "Kaviyadharshini", assigneeId: "u10", department: "Tech", due: "May 24", priority: "high", status: "backlog", checklistDone: 1, checklistTotal: 5 },
  { id: "t3", projectId: "p4", projectName: "CMT Batch Production", title: "Evaluate new suppliers for raw materials", assignee: "N Revathi", assigneeId: "u27", department: "Operations", due: "May 26", priority: "medium", status: "backlog", checklistDone: 0, checklistTotal: 3 },
  { id: "t4", projectId: "p5", projectName: "FineKine Packaging Redesign", title: "Q2 enterprise outreach campaign planning", assignee: "Visali Perumal", assigneeId: "u19", department: "Sales & Marketing", due: "May 28", priority: "medium", status: "backlog", checklistDone: 2, checklistTotal: 6 },
  { id: "t5", projectId: "p5", projectName: "FineKine Packaging Redesign", title: "Website SEO audit and content refresh", assignee: "Priya Manikanda", assigneeId: "u25", department: "Sales & Marketing", due: "May 30", priority: "low", status: "backlog", checklistDone: 1, checklistTotal: 4 },
  { id: "t6", projectId: "p2", projectName: "iHerd App Release", title: "API integration for data analytics module", assignee: "Simpson J", assigneeId: "u11", department: "Tech", due: "May 20", priority: "high", status: "in-progress", checklistDone: 3, checklistTotal: 5 },
  { id: "t7", projectId: "p1", projectName: "NIRAMM Sensor Development", title: "Optimize sensor validation workflow", assignee: "Partiban", assigneeId: "u15", department: "Electronics & R&D", due: "May 21", priority: "high", status: "in-progress", checklistDone: 4, checklistTotal: 7 },
  { id: "t8", projectId: "p4", projectName: "CMT Batch Production", title: "Scale-up batch validation", assignee: "Mamtha K", assigneeId: "u28", department: "Operations", due: "May 19", priority: "critical", status: "in-progress", checklistDone: 5, checklistTotal: 8 },
  { id: "t9", projectId: "p6", projectName: "Operations SOP Rollout", title: "Prepare operations pipeline report", assignee: "Praveen V", assigneeId: "u29", department: "Operations", due: "May 22", priority: "medium", status: "in-progress", checklistDone: 2, checklistTotal: 4 },
  { id: "t10", projectId: "p7", projectName: "Digital Campaign Q3", title: "Launch LinkedIn lead gen campaign", assignee: "Sukvinthar Singh", assigneeId: "u18", department: "Sales & Marketing", due: "May 23", priority: "medium", status: "in-progress", checklistDone: 1, checklistTotal: 3 },
  { id: "t11", projectId: "p2", projectName: "iHerd App Release", title: "UI/UX review for patient dashboard", assignee: "Praveena Raja", assigneeId: "u12", department: "Tech", due: "May 18", priority: "high", status: "in-review", checklistDone: 5, checklistTotal: 5 },
  { id: "t12", projectId: "p1", projectName: "NIRAMM Sensor Development", title: "Electronics assay protocol validation", assignee: "Priyanka A", assigneeId: "u16", department: "Electronics & R&D", due: "May 19", priority: "high", status: "in-review", checklistDone: 6, checklistTotal: 6 },
  { id: "t13", projectId: "p6", projectName: "Operations SOP Rollout", title: "SOP update: Cleanroom process", assignee: "N Revathi", assigneeId: "u27", department: "Operations", due: "May 20", priority: "medium", status: "in-review", checklistDone: 3, checklistTotal: 3 },
  { id: "t14", projectId: "p5", projectName: "FineKine Packaging Redesign", title: "Deal desk review - Acme Biologics", assignee: "Immanuel Dominic L", assigneeId: "u20", department: "Sales & Marketing", due: "May 21", priority: "high", status: "in-review", checklistDone: 4, checklistTotal: 4 },
  { id: "t15", projectId: "p1", projectName: "NIRAMM Sensor Development", title: "Waiting for regulatory feedback", assignee: "Silambarasan", assigneeId: "u17", department: "Electronics & R&D", due: "May 25", priority: "high", status: "blocked", checklistDone: 2, checklistTotal: 5 },
  { id: "t16", projectId: "p2", projectName: "iHerd App Release", title: "Payment gateway sandbox access", assignee: "Hari Prakash", assigneeId: "u13", department: "Tech", due: "May 22", priority: "medium", status: "blocked", checklistDone: 1, checklistTotal: 3 },
  { id: "t17", projectId: "p4", projectName: "CMT Batch Production", title: "Fill/Finish equipment maintenance", assignee: "Mamtha K", assigneeId: "u28", department: "Operations", due: "May 19", priority: "critical", status: "blocked", checklistDone: 0, checklistTotal: 4 },
  { id: "t18", projectId: "p5", projectName: "FineKine Packaging Redesign", title: "Customer contract approval", assignee: "Praveen K", assigneeId: "u21", department: "Sales & Marketing", due: "May 18", priority: "high", status: "blocked", checklistDone: 1, checklistTotal: 2 },
  { id: "t19", projectId: "p1", projectName: "NIRAMM Sensor Development", title: "Literature review on sensor delivery", assignee: "Aishwarya Jayachandran", assigneeId: "u14", department: "Electronics & R&D", due: "May 10", priority: "medium", status: "completed", checklistDone: 5, checklistTotal: 5 },
  { id: "t20", projectId: "p2", projectName: "iHerd App Release", title: "Fix login bug on mobile iOS", assignee: "Kaviyadharshini", assigneeId: "u10", department: "Tech", due: "May 12", priority: "high", status: "completed", checklistDone: 3, checklistTotal: 3 },
  { id: "t21", projectId: "p8", projectName: "Electronics Validation Program", title: "QC test: Batch R&D-0425", assignee: "Partiban", assigneeId: "u15", department: "Electronics & R&D", due: "May 11", priority: "medium", status: "completed", checklistDone: 6, checklistTotal: 6 },
  { id: "t22", projectId: "p6", projectName: "Operations SOP Rollout", title: "Q1 performance summary deck", assignee: "Praveen V", assigneeId: "u29", department: "Operations", due: "May 09", priority: "low", status: "completed", checklistDone: 4, checklistTotal: 4 },
  { id: "t23", projectId: "p7", projectName: "Digital Campaign Q3", title: "Email newsletter May edition", assignee: "Shapna Palani", assigneeId: "u22", department: "Sales & Marketing", due: "May 13", priority: "low", status: "completed", checklistDone: 3, checklistTotal: 3 },
];
export const initialApprovals: Approval[] = [
  { id: "PR-2025-0458", type: "Purchase Request", requester: "Partiban", department: "Electronics & R&D", priority: "high", status: "pending", submittedAt: "May 18, 2025 10:24 AM", amount: 1033350, purpose: "Purchase of laboratory equipment for R&D testing and analysis" },
  { id: "TA-2025-0786", type: "Task Approval", requester: "Kaviyadharshini", department: "Tech", priority: "medium", status: "pending", submittedAt: "May 18, 2025 09:10 AM" },
  { id: "PRV-2025-023", type: "Project Review", requester: "N Revathi", department: "Operations", priority: "high", status: "pending", submittedAt: "May 17, 2025 04:50 PM" },
  { id: "BA-2025-031", type: "Budget Approval", requester: "Priya Manikanda", department: "Sales & Marketing", priority: "high", status: "pending", submittedAt: "May 17, 2025 02:32 PM" },
  { id: "PBR-2025-112", type: "Production Batch Release", requester: "Mamtha K", department: "Operations", priority: "critical", status: "pending", submittedAt: "May 17, 2025 11:05 AM" },
  { id: "QA-2025-067", type: "Electronics Validation Review", requester: "Priyanka A", department: "Electronics & R&D", priority: "medium", status: "pending", submittedAt: "May 16, 2025 03:18 PM" },
  { id: "LV-2025-019", type: "Leave Approval", requester: "Shapna Palani", department: "Sales & Marketing", priority: "low", status: "pending", submittedAt: "May 16, 2025 10:00 AM" },
];

export const activities: Activity[] = [
  { id: "a1", user: "Siddarth Pa", action: "updated progress on iHerd App Release", time: "5 min ago" },
  { id: "a2", user: "Partiban", action: "submitted approval for Electronics Validation Program", time: "22 min ago" },
  { id: "a3", user: "Priya Manikanda", action: "created a new task in Sales & Marketing", time: "1 hr ago" },
  { id: "a4", user: "Kaviyadharshini", action: "completed UI/UX Optimization", time: "2 hrs ago" },
  { id: "a5", user: "System", action: "backup completed successfully", time: "4 hrs ago" },
];

export const upcomingDeadlines = [
  { id: "dl1", title: "NIRAMM Sensor Validation", days: 2, priority: "high" as const },
  { id: "dl2", title: "iHerd App Release Checklist", days: 4, priority: "high" as const },
  { id: "dl3", title: "FineKine Campaign Review", days: 5, priority: "medium" as const },
  { id: "dl4", title: "Operations SOP Rollout", days: 8, priority: "low" as const },
];

export const departmentProgress = [
  { name: "Tech", progress: 72, status: "on-track" as const },
  { name: "Electronics & R&D", progress: 65, status: "on-track" as const },
  { name: "Sales & Marketing", progress: 60, status: "at-risk" as const },
  { name: "Operations", progress: 70, status: "on-track" as const },
];

export const projectTrend = [
  { month: "Jan", planned: 20, completed: 18 },
  { month: "Feb", planned: 25, completed: 22 },
  { month: "Mar", planned: 30, completed: 27 },
  { month: "Apr", planned: 35, completed: 30 },
  { month: "May", planned: 42, completed: 36 },
  { month: "Jun", planned: 48, completed: 40 },
];

export const tasksByDept = [
  { dept: "Tech", tasks: 6 },
  { dept: "Electronics & R&D", tasks: 6 },
  { dept: "Sales & Marketing", tasks: 5 },
  { dept: "Operations", tasks: 3 },
];

export const reportSnapshot = [
  { dept: "Tech", projects: 1, assigned: 6, completed: 3, onTime: 50, overdue: 1, approval: 18, workload: "Optimal" },
  { dept: "Electronics & R&D", projects: 3, assigned: 6, completed: 1, onTime: 17, overdue: 1, approval: 20, workload: "Optimal" },
  { dept: "Sales & Marketing", projects: 2, assigned: 5, completed: 1, onTime: 20, overdue: 1, approval: 22, workload: "Optimal" },
  { dept: "Operations", projects: 2, assigned: 3, completed: 1, onTime: 33, overdue: 1, approval: 19, workload: "Underloaded" },
];

export type MyTaskStatus = "not-started" | "in-progress" | "completed";
export interface MyTask { id: string; title: string; due: string; department: string; status: MyTaskStatus; }
export const myTasks: MyTask[] = [
  { id: "mt1", title: "Review iHerd app checklist", due: "10:00 AM", department: "Tech", status: "in-progress" },
  { id: "mt2", title: "Validate NIRAMM sensor firmware", due: "1:00 PM", department: "Electronics & R&D", status: "not-started" },
  { id: "mt3", title: "Prepare FineKine campaign assets", due: "3:00 PM", department: "Sales & Marketing", status: "in-progress" },
  { id: "mt4", title: "Update Operations SOP notes", due: "May 13", department: "Operations", status: "not-started" },
  { id: "mt5", title: "Send project progress update", due: "May 14", department: "Tech", status: "not-started" },
];

export const messages = [
  { id: "m1", from: "Siddarth Pa", text: "Please upload the latest task update after completion." },
  { id: "m2", from: "Veeramani Veerappan", text: "Don't forget the updated checklist in the docs." },
  { id: "m3", from: "Adi Narayanan", text: "Great work on getting those tasks done early." },
];

export const projectDetail = {
  id: "p1",
  name: "NIRAMM AI Development",
  subtitle: "AI-powered predictive maintenance platform with real-time anomaly detection and insights.",
  owner: "Veeramani Veerappan",
  department: "R&D",
  due: "Jun 30, 2025",
  priority: "high" as const,
  teamSize: 8,
  progress: 72,
  budget: 3750000,
  spent: 1906250,
  plannedHours: 2400,
  loggedHours: 1728,
  milestones: [
    { id: "ms1", name: "Requirement Finalization", start: "May 12", end: "May 16", done: true },
    { id: "ms2", name: "Sensor Integration", start: "May 17", end: "May 27", done: true },
    { id: "ms3", name: "Firmware Build", start: "May 20", end: "Jun 4", done: true },
    { id: "ms4", name: "App Integration", start: "May 28", end: "Jun 10", done: false },
    { id: "ms5", name: "Testing", start: "Jun 5", end: "Jun 18", done: false },
    { id: "ms6", name: "Validation", start: "Jun 12", end: "Jun 24", done: false },
    { id: "ms7", name: "Launch Readiness", start: "Jun 25", end: "Jun 30", done: false },
  ],
  tasks: [
    { id: "pt1", title: "Define project requirements", status: "completed" },
    { id: "pt2", title: "Review technical specifications", status: "completed" },
    { id: "pt3", title: "Finalize system architecture", status: "completed" },
    { id: "pt4", title: "Integrate sensor modules", status: "in-progress" },
    { id: "pt5", title: "Build firmware v1.0", status: "in-progress" },
    { id: "pt6", title: "Integrate mobile application", status: "pending" },
    { id: "pt7", title: "Perform system testing", status: "pending" },
    { id: "pt8", title: "Validate performance metrics", status: "pending" },
    { id: "pt9", title: "Prepare launch documentation", status: "pending" },
    { id: "pt10", title: "Go-live readiness review", status: "pending" },
  ],
  documents: [
    "NIRAMM_Requirements_v1.2.pdf",
    "System_Architecture_Diagram.vsdx",
    "Firmware_Specs_v1.0.docx",
    "Testing_Plan_v1.3.pdf",
    "Risk_Assessment_2025.xlsx",
  ],
  risks: [
    { id: "r1", title: "Sensor supply delay", severity: "high" as const },
    { id: "r2", title: "Third-party API dependency", severity: "medium" as const },
    { id: "r3", title: "Firmware stability under load", severity: "low" as const },
  ],
};
