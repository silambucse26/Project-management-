import { createFileRoute } from "@tanstack/react-router";
import {
  useMemo,
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Laptop,
  Lightbulb,
  Package,
  Search,
  Send,
  ShieldAlert,
  TicketCheck,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/help-center")({
  component: HelpCenterPage,
});
type RequestStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Rejected";

type RequestPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Urgent";

type HelpRequest = {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  submittedBy: string;
  submittedById?: string;
  department: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
};

type RequestStateProps = {
  requests: HelpRequest[];
  setRequests: Dispatch<SetStateAction<HelpRequest[]>>;
};
const categories = [
  {
    name: "Technical Issue",
    icon: Wrench,
    description:
      "Computer, printer, software, internet, login, or email problems.",
  },
  {
    name: "Production Request",
    icon: Building2,
    description:
      "Request raw materials, tools, machines, safety items, or production support.",
  },
  {
    name: "Workplace Complaint",
    icon: AlertTriangle,
    description:
      "Report AC, electricity, water, cleanliness, cafeteria, furniture, or office issues.",
  },
  {
    name: "HR Request",
    icon: UserRound,
    description:
      "Leave, salary, attendance, ID card, benefits, or document requests.",
  },
  {
    name: "IT Support",
    icon: Laptop,
    description:
      "Password reset, VPN access, new laptop, software installation, or email setup.",
  },
  {
    name: "Inventory Request",
    icon: Package,
    description:
      "Stationery, printer paper, monitor, keyboard, mouse, chair, or office items.",
  },
  {
    name: "Suggestion",
    icon: Lightbulb,
    description:
      "Share ideas to improve workflow, production, office process, or cost savings.",
  },
  {
    name: "Safety Incident",
    icon: ShieldAlert,
    description:
      "Report unsafe machinery, fire hazard, accident, near miss, or safety concern.",
  },
  {
    name: "Transport Request",
    icon: Truck,
    description:
      "Company vehicle, delivery support, driver request, or transport assistance.",
  },
];

const supportTeams = [
  "Unassigned",
  "Administration",
  "IT Support",
  "HR Department",
  "Operations Team",
  "Production Manager",
  "Department Head",
];

const initialHelpRequests: HelpRequest[] = [
  {
    id: "REQ-1001",
    category: "IT Support",
    title: "Email login issue",
    description:
      "Unable to access office email after changing the password.",
    priority: "High",
    status: "In Progress",
    submittedBy: "Kaviyadharshini",
    submittedById: "u10",
    department: "Tech",
    assignedTo: "IT Support",
    createdAt: "2026-07-09T09:30:00",
    updatedAt: "2026-07-09T10:15:00",
  },
  {
    id: "REQ-1002",
    category: "Production Request",
    title: "Need safety gloves",
    description:
      "The production team needs additional safety gloves for machine operation.",
    priority: "Medium",
    status: "Pending",
    submittedBy: "Mamtha K",
    submittedById: "u28",
    department: "Operations",
    createdAt: "2026-07-09T10:15:00",
  },
  {
    id: "REQ-1003",
    category: "Workplace Complaint",
    title: "Air conditioner not working",
    description:
      "The air conditioner in the marketing section is not working.",
    priority: "High",
    status: "Pending",
    submittedBy: "Visali Perumal",
    submittedById: "u19",
    department: "Sales & Marketing",
    createdAt: "2026-07-10T08:45:00",
  },
  {
    id: "REQ-1004",
    category: "HR Request",
    title: "Employment verification letter",
    description:
      "An employment verification letter is required for a bank application.",
    priority: "Low",
    status: "Resolved",
    submittedBy: "Praveena Raja",
    submittedById: "u12",
    department: "Tech",
    assignedTo: "HR Department",
    createdAt: "2026-07-08T14:20:00",
    updatedAt: "2026-07-09T11:00:00",
  },
  {
    id: "REQ-1005",
    category: "Safety Incident",
    title: "Loose electrical cable near machine",
    description:
      "A loose electrical cable was found near the production machine.",
    priority: "Urgent",
    status: "In Progress",
    submittedBy: "N Revathi",
    submittedById: "u27",
    department: "Operations",
    assignedTo: "Operations Team",
    createdAt: "2026-07-10T07:40:00",
  },
];
function HelpCenterPage() {
  const { role } = useApp();

  const [requests, setRequests] =
    useState<HelpRequest[]>(initialHelpRequests);

  if (role === "admin") {
    return (
      <AdminHelpCenter
        requests={requests}
        setRequests={setRequests}
      />
    );
  }

  return (
    <EmployeeHelpCenter
      requests={requests}
      setRequests={setRequests}
    />
  );
}
function AdminHelpCenter({
  requests,
  setRequests,
}: RequestStateProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<RequestStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] =
    useState<RequestPriority | "All">("All");

  const totalCount = requests.length;

  const pendingCount = requests.filter(
    (request) => request.status === "Pending",
  ).length;

  const inProgressCount = requests.filter(
    (request) => request.status === "In Progress",
  ).length;

  const resolvedCount = requests.filter(
    (request) => request.status === "Resolved",
  ).length;

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.id.toLowerCase().includes(query) ||
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        request.submittedBy.toLowerCase().includes(query) ||
        request.department.toLowerCase().includes(query) ||
        request.assignedTo?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        request.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    requests,
    searchQuery,
    statusFilter,
    priorityFilter,
  ]);

  function updateRequestStatus(
    requestId: string,
    status: RequestStatus,
  ) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              updatedAt: new Date().toISOString(),
            }
          : request,
      ),
    );

    toast.success(`Request status changed to ${status}.`);
  }

  function updateRequestAssignment(
    requestId: string,
    assignedTo: string,
  ) {
    setRequests((currentRequests) =>
      currentRequests.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        const isUnassigned =
          assignedTo === "Unassigned";

        return {
          ...request,
          assignedTo: isUnassigned
            ? undefined
            : assignedTo,
          status:
            !isUnassigned && request.status === "Pending"
              ? "In Progress"
              : request.status,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    toast.success(
      assignedTo === "Unassigned"
        ? "Request assignment removed."
        : `Request assigned to ${assignedTo}.`,
    );
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  return (
    <AppLayout
      title="Help Center Management"
      badge="Admin Support Desk"
      subtitle="Review, assign, track, and resolve employee support requests"
    >
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminSummaryCard
            title="Total Requests"
            value={totalCount}
            icon={Headphones}
          />

          <AdminSummaryCard
            title="Pending"
            value={pendingCount}
            icon={Clock3}
          />

          <AdminSummaryCard
            title="In Progress"
            value={inProgressCount}
            icon={TicketCheck}
          />

          <AdminSummaryCard
            title="Resolved"
            value={resolvedCount}
            icon={CheckCircle2}
          />
        </div>

        {/* Request queue */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Employee Requests
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage support requests submitted by employees
                across all departments.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search requests..."
                  aria-label="Search employee requests"
                  className="pl-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | RequestStatus
                      | "All",
                  )
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
                aria-label="Filter requests by status"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value as
                      | RequestPriority
                      | "All",
                  )
                }
                className="h-10 rounded-md border bg-background px-3 text-sm"
                aria-label="Filter requests by priority"
              >
                <option value="All">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">
                    Request
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Employee
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Department
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Category
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Priority
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Assignment
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th className="px-3 py-3 font-medium">
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b align-top last:border-0"
                  >
                    <td className="px-3 py-4">
                      <div className="font-medium">
                        {request.title}
                      </div>

                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {request.id}
                      </div>

                      <p className="mt-2 max-w-72 text-xs text-muted-foreground">
                        {request.description}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      {request.submittedBy}
                    </td>

                    <td className="px-3 py-4">
                      {request.department}
                    </td>

                    <td className="px-3 py-4">
                      {request.category}
                    </td>

                    <td className="px-3 py-4">
                      <PriorityBadge
                        priority={request.priority}
                      />
                    </td>

                    <td className="px-3 py-4">
                      <select
                        value={
                          request.assignedTo ??
                          "Unassigned"
                        }
                        onChange={(event) =>
                          updateRequestAssignment(
                            request.id,
                            event.target.value,
                          )
                        }
                        className="h-9 min-w-40 rounded-md border bg-background px-2 text-xs"
                        aria-label={`Assign ${request.id}`}
                      >
                        {supportTeams.map((team) => (
                          <option
                            key={team}
                            value={team}
                          >
                            {team}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-4">
                      <select
                        value={request.status}
                        onChange={(event) =>
                          updateRequestStatus(
                            request.id,
                            event.target
                              .value as RequestStatus,
                          )
                        }
                        className="h-9 min-w-32 rounded-md border bg-background px-2 text-xs"
                        aria-label={`Change status for ${request.id}`}
                      >
                        <option value="Pending">
                          Pending
                        </option>
                        <option value="In Progress">
                          In Progress
                        </option>
                        <option value="Resolved">
                          Resolved
                        </option>
                        <option value="Rejected">
                          Rejected
                        </option>
                      </select>

                      <div className="mt-2">
                        <StatusBadge
                          status={request.status}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-4 text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-14 text-center"
                    >
                      <Search className="mx-auto mb-3 size-7 text-muted-foreground" />

                      <p className="font-medium">
                        No requests found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try changing the search text or
                        filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Admin information cards */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold">
              Admin Responsibilities
            </h3>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>• Review newly submitted requests</p>
              <p>• Assign requests to the correct team</p>
              <p>• Track pending and urgent issues</p>
              <p>• Update request status</p>
              <p>• Close resolved or rejected requests</p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold">
              Priority Guidance
            </h3>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <PriorityBadge priority="Urgent" />
                <span className="text-muted-foreground">
                  Safety, security, or business-stopping issue
                </span>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority="High" />
                <span className="text-muted-foreground">
                  Important issue requiring quick action
                </span>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority="Medium" />
                <span className="text-muted-foreground">
                  Normal operational request
                </span>
              </div>

              <div className="flex items-center gap-2">
                <PriorityBadge priority="Low" />
                <span className="text-muted-foreground">
                  Non-urgent request or suggestion
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
function EmployeeHelpCenter({
  requests,
  setRequests,
}: RequestStateProps) {
  const { currentUser, role } = useApp();

  const [category, setCategory] =
    useState("Technical Issue");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<RequestPriority>("Medium");

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (item) => item.name === category,
      ),
    [category],
  );

  const SelectedCategoryIcon =
    selectedCategory?.icon ?? Headphones;

  const visibleRequests = useMemo(() => {
    if (role === "head") {
      return requests.filter(
        (request) =>
          request.department ===
            currentUser.department ||
          request.submittedById === currentUser.id ||
          request.submittedBy === currentUser.name,
      );
    }

    return requests.filter(
      (request) =>
        request.submittedById === currentUser.id ||
        request.submittedBy === currentUser.name,
    );
  }, [
    requests,
    role,
    currentUser.id,
    currentUser.name,
    currentUser.department,
  ]);

  function handleSubmitRequest() {
    if (!title.trim()) {
      toast.error("Please enter a request title.");
      return;
    }

    if (!description.trim()) {
      toast.error(
        "Please describe your issue or request.",
      );
      return;
    }

    const newRequest: HelpRequest = {
      id: createRequestId(),
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "Pending",
      submittedBy: currentUser.name,
      submittedById: currentUser.id,
      department: currentUser.department,
      createdAt: new Date().toISOString(),
    };

    setRequests((currentRequests) => [
      newRequest,
      ...currentRequests,
    ]);

    setTitle("");
    setDescription("");
    setPriority("Medium");

    toast.success("Request submitted successfully.");
  }

  return (
    <AppLayout
      title="Help Center"
      badge="Support Desk"
      subtitle="Submit complaints, request resources, report issues, or ask for office support"
    >
      <Tabs defaultValue="raise-request">
        <TabsList>
          <TabsTrigger value="raise-request">
            Raise Request
          </TabsTrigger>

          <TabsTrigger value="my-requests">
            {role === "head"
              ? "Department Requests"
              : "My Requests"}
          </TabsTrigger>

          <TabsTrigger value="contacts">
            Contacts
          </TabsTrigger>
        </TabsList>

        {/* Raise request */}
        <TabsContent
          value="raise-request"
          className="mt-5"
        >
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
            <Card className="p-5">
              <h3 className="text-lg font-semibold">
                Raise a New Request
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose a category and submit your
                complaint, requirement, or support request.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active =
                    category === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() =>
                        setCategory(item.name)
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="mb-3 size-5 text-primary" />

                      <div className="text-sm font-medium">
                        {item.name}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="selected-category">
                    Selected Category
                  </Label>

                  <Input
                    id="selected-category"
                    value={category}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="request-title">
                    Request Title
                  </Label>

                  <Input
                    id="request-title"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="Example: Need printer repair in office"
                  />
                </div>

                <div>
                  <Label htmlFor="request-description">
                    Description
                  </Label>

                  <textarea
                    id="request-description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Explain the issue, requirement, location, quantity, or inconvenience..."
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <Label htmlFor="request-priority">
                    Priority
                  </Label>

                  <select
                    id="request-priority"
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target
                          .value as RequestPriority,
                      )
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="High">High</option>
                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitRequest}
                >
                  <Send className="mr-2 size-4" />
                  Submit Request
                </Button>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <SelectedCategoryIcon className="size-6 text-primary" />

                  <div>
                    <h3 className="font-semibold">
                      {category}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {selectedCategory?.description}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold">
                  Examples You Can Submit
                </h3>

                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>
                    • Office inconvenience or workplace
                    complaint
                  </p>
                  <p>
                    • Requirement for production materials or
                    tools
                  </p>
                  <p>
                    • IT or system access problem
                  </p>
                  <p>
                    • HR, salary, attendance, or document
                    request
                  </p>
                  <p>
                    • Safety issue, accident, or unsafe
                    condition
                  </p>
                  <p>
                    • Suggestion to improve office or
                    production workflow
                  </p>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold">
                  Request Status Meaning
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Pending" />
                    <span>Waiting for review</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status="In Progress" />
                    <span>Being handled</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status="Resolved" />
                    <span>Completed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status="Rejected" />
                    <span>Not approved</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* My or department requests */}
        <TabsContent
          value="my-requests"
          className="mt-5"
        >
          <Card className="p-5">
            <h3 className="text-lg font-semibold">
              {role === "head"
                ? "Department Requests"
                : "My Requests"}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {role === "head"
                ? `Track requests submitted by employees in ${currentUser.department}.`
                : "Track complaints, support tickets, and office requirements submitted by you."}
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4">
                      Request ID
                    </th>
                    <th className="py-3 pr-4">
                      Category
                    </th>
                    <th className="py-3 pr-4">
                      Title
                    </th>

                    {role === "head" && (
                      <th className="py-3 pr-4">
                        Submitted By
                      </th>
                    )}

                    <th className="py-3 pr-4">
                      Priority
                    </th>
                    <th className="py-3 pr-4">
                      Status
                    </th>
                    <th className="py-3 pr-4">
                      Assigned To
                    </th>
                    <th className="py-3 pr-4">
                      Submitted On
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {request.id}
                      </td>

                      <td className="py-3 pr-4">
                        {request.category}
                      </td>

                      <td className="py-3 pr-4">
                        <div>{request.title}</div>

                        <p className="mt-1 max-w-72 text-xs text-muted-foreground">
                          {request.description}
                        </p>
                      </td>

                      {role === "head" && (
                        <td className="py-3 pr-4">
                          {request.submittedBy}
                        </td>
                      )}

                      <td className="py-3 pr-4">
                        <PriorityBadge
                          priority={request.priority}
                        />
                      </td>

                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={request.status}
                        />
                      </td>

                      <td className="py-3 pr-4">
                        {request.assignedTo ??
                          "Not assigned"}
                      </td>

                      <td className="py-3 pr-4">
                        {formatDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}

                  {visibleRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          role === "head" ? 8 : 7
                        }
                        className="py-12 text-center text-muted-foreground"
                      >
                        No requests have been submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Contacts */}
        <TabsContent
          value="contacts"
          className="mt-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "IT Support",
                "itsupport@chimertech.com",
                "Ext. 220",
              ],
              [
                "HR Department",
                "hr@chimertech.com",
                "Ext. 205",
              ],
              [
                "Production Manager",
                "production@chimertech.com",
                "Ext. 310",
              ],
              [
                "Administration",
                "admin@chimertech.com",
                "Ext. 100",
              ],
            ].map(([name, email, phone]) => (
              <Card
                key={name}
                className="p-5"
              >
                <h3 className="font-semibold">
                  {name}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {email}
                </p>

                <p className="text-sm text-muted-foreground">
                  {phone}
                </p>
              </Card>
            ))}
          </div>

          <Card className="mt-5 border-destructive/30 p-5">
            <h3 className="font-semibold text-destructive">
              Emergency Contacts
            </h3>

            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <p>Security: Ext. 111</p>
              <p>Fire Team: Ext. 112</p>
              <p>First Aid: Ext. 113</p>
              <p>Maintenance: Ext. 114</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
type AdminSummaryCardProps = {
  title: string;
  value: number;
  icon: ComponentType<{
    className?: string;
  }>;
};

function AdminSummaryCard({
  title,
  value,
  icon: Icon,
}: AdminSummaryCardProps) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold">
          {value}
        </p>
      </div>

      <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const className =
    status === "Resolved"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "In Progress"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "Rejected"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Badge
      variant="outline"
      className={className}
    >
      {status}
    </Badge>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: RequestPriority;
}) {
  const className =
    priority === "Urgent"
      ? "border-red-300 bg-red-50 text-red-700"
      : priority === "High"
        ? "border-orange-300 bg-orange-50 text-orange-700"
        : priority === "Medium"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Badge
      variant="outline"
      className={className}
    >
      {priority}
    </Badge>
  );
}

function createRequestId() {
  const number = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `REQ-${number}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}