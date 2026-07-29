import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const {
  approvals,
  setApprovalStatus,
  replyToApproval,
  tasks,
  submitTaskPendingInfo,
  submitLeaveRequest,
  currentUser,
  role,
} = useApp();

  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<string | null>(
    approvals[0]?.id ?? null
  );
  const [filterType, setFilterType] = useState("all");
  const [selectedPendingTaskId, setSelectedPendingTaskId] = useState("");
  const [pendingInfo, setPendingInfo] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [replyText, setReplyText] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  const filtered = useMemo(() => {
    return approvals.filter((approval) => {
      const tabMatch =
        tab === "pending"
          ? approval.status === "pending"
          : tab === "approved"
          ? approval.status === "approved"
          : tab === "rejected"
          ? approval.status === "rejected"
          : tab === "escalated"
          ? approval.status === "escalated"
          : true;

      const typeMatch = filterType === "all" || approval.type === filterType;

      return tabMatch && typeMatch;
    });
  }, [approvals, tab, filterType]);

  const sel =
    approvals.find((approval) => approval.id === selected) ?? filtered[0];

  const isLeaveRequest = sel?.type === "Leave Request";
  const canApprove = role === "admin" || (role === "head" && !isLeaveRequest);
  const showLeaveRequestForm = role === "member";

  const pending = approvals.filter(
    (approval) => approval.status === "pending"
  ).length;

  const escalated = approvals.filter(
    (approval) => approval.status === "escalated"
  ).length;

  const completed = approvals.filter(
    (approval) =>
      approval.status === "approved" ||
      approval.status === "rejected" ||
      approval.status === "changes"
  ).length;

  const types = Array.from(new Set(approvals.map((approval) => approval.type)));

  const pendingTasks = tasks.filter(
    (task) =>
      task.status !== "completed" || (task.completionPercent ?? 0) < 100
  );

  function act(status: "approved" | "rejected" | "changes") {
    if (!canApprove) {
      return toast.error("Team members do not have approval permission");
    }

    if (!sel) return;

    if (!decisionReason.trim()) {
      return toast.error("Enter a reason before submitting the approval decision");
    }

    setApprovalStatus(sel.id, status, decisionReason.trim());
    setDecisionReason("");

    toast.success(
      `${sel.id} ${
        status === "approved"
          ? "approved"
          : status === "rejected"
          ? "rejected"
          : "changes requested"
      }`
    );
  }

  function escalate() {
    if (!canApprove) {
      return toast.error("Team members do not have escalation permission");
    }

    if (!sel) return;

    setApprovalStatus(
      sel.id,
      "escalated",
      replyText.trim() || "Escalated to admin"
    );

    setReplyText("");
    toast.success(`${sel.id} escalated to admin`);
  }

  function sendPendingInfo() {
    if (!selectedPendingTaskId) {
      return toast.error("Select a pending task");
    }

    if (!pendingInfo.trim()) {
      return toast.error("Enter information about the pending task");
    }

    submitTaskPendingInfo(selectedPendingTaskId, pendingInfo.trim());

    setPendingInfo("");
    setSelectedPendingTaskId("");
    setTab("pending");
    setFilterType("Task Pending Info");

    toast.success("Pending task information sent to approvals");
  }

  function sendLeaveRequest() {
  if (!leaveType || !startDate || !endDate || !leaveReason.trim()) {
    return toast.error("Please fill all leave request details");
  }

  submitLeaveRequest({
    leaveType,
    startDate,
    endDate,
    reason: leaveReason.trim(),
  });

  setLeaveType("");
  setStartDate("");
  setEndDate("");
  setLeaveReason("");
  setTab("pending");
  setFilterType("Leave Request");

  toast.success("Leave request submitted for approval");
}
  function sendReply() {
    if (!canApprove) {
      return toast.error("Team members cannot reply as approvers");
    }

    if (!sel) return;

    if (!replyText.trim()) {
      return toast.error("Enter a reply for this task info");
    }

    replyToApproval(sel.id, replyText.trim());
    setReplyText("");

    toast.success("Reply sent to the requester");
  }

  return (
    <AppLayout
      title="Approvals & Workflow"
      badge="Center"
      subtitle="Review and act on requests"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending Approvals" value={pending} icon={Clock} tone="warning" />
        <StatCard label="Escalations" value={escalated} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Total Requests" value={approvals.length} icon={Clock} tone="info" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Workflow Pipeline</h3>

        <div className="flex items-center justify-between gap-2">
          {["Request", "Review", "Approve", "Archive"].map(
            (step, index, array) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className="flex-1 p-3 rounded-lg bg-primary/10 text-primary text-center text-sm font-medium">
                  {step}
                </div>

                {index < array.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                )}
              </div>
            )
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-semibold">Leave Request</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {role === "head"
              ? "You can review leave requests from your team and track the approval workflow."
              : "Submit a leave request for approval by your Team Head and Admin."}
          </p>
        </div>

        {showLeaveRequestForm ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Approval Flow</Label>
                <Input value="Team Head → Admin" disabled />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Reason</Label>
              <Textarea
                value={leaveReason}
                onChange={(event) => setLeaveReason(event.target.value)}
                placeholder="Enter reason for leave..."
                rows={4}
              />
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={sendLeaveRequest}>Submit Leave Request</Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Leave workflow for your team</div>
            <div className="mt-2">
              Member request → Head review → Admin final approval
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Send Pending Task Info</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select a task and send information about why it is still pending.
            </p>
          </div>

          <Badge variant="outline">{pendingTasks.length} pending tasks</Badge>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr_auto] gap-3 items-end">
          <div>
            <Label>Task</Label>

            <Select
              value={selectedPendingTaskId}
              onValueChange={setSelectedPendingTaskId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pending task" />
              </SelectTrigger>

              <SelectContent>
                {pendingTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title} - {task.completionPercent ?? 0}% done
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Information</Label>
            <Textarea
              value={pendingInfo}
              onChange={(event) => setPendingInfo(event.target.value)}
              placeholder="Add reason, blocker, dependency, or next action..."
              rows={2}
            />
          </div>

          <Button onClick={sendPendingInfo}>Send Info</Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
              </TabsList>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Tabs>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No items in this view.
              </div>
            )}

            {filtered.map((approval) => (
              <button
                key={approval.id}
                onClick={() => setSelected(approval.id)}
                className={`w-full text-left p-3 rounded-lg border hover:bg-muted/30 transition-colors ${
                  sel?.id === approval.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className="size-4 text-primary" />
                      <span className="font-medium text-sm truncate">
                        {approval.type}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {approval.id}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {approval.requester} -&gt;{" "}
                      {approval.approverName ?? "Approval Team"} ·{" "}
                      {approval.department}
                    </div>

                    {approval.response && (
                      <div className="text-[11px] text-success mt-1">
                        Reply received from {approval.respondedBy}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={approval.priority} />
                    <StatusBadge status={approval.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          {sel ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{sel.type}</h3>
                <Badge variant="outline">{sel.id}</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                {sel.purpose ?? "Approval request awaiting review."}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requester</span>
                  <span className="font-medium">{sel.requester}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">To Head</span>
                  <span className="font-medium">
                    {sel.approverName ?? "Approval Team"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{sel.department}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{sel.submittedAt}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <PriorityBadge priority={sel.priority} />
                </div>

                {sel.type === "Leave Request" && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Current Status</span>
                      <StatusBadge status={sel.status} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Flow: Submitted → Head review → Admin approval
                    </div>
                  </div>
                )}

                {sel.amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">
                      Rs. {sel.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              {sel.taskTitle && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="text-xs font-semibold mb-2">Task Request</div>

                  <div className="space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Task</span>
                      <span className="font-medium text-right">
                        {sel.taskTitle}
                      </span>
                    </div>

                    {sel.projectName && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Project</span>
                        <span className="text-right">{sel.projectName}</span>
                      </div>
                    )}

                    {sel.completionPercent !== undefined && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold">
                          {sel.completionPercent}%
                        </span>
                      </div>
                    )}

                    {sel.reason && (
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Member Information
                        </div>
                        <div className="rounded-md bg-background p-2 text-sm">
                          {sel.reason}
                        </div>
                      </div>
                    )}

                    {sel.response && (
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Head Reply
                        </div>

                        <div className="rounded-md border border-success/20 bg-success/10 p-2 text-sm">
                          <div>{sel.response}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {sel.respondedBy} · {sel.respondedAt}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sel.taskTitle && canApprove && (
                <div className="mt-4 rounded-lg border p-3">
                  <Label>Reply About Pending Task</Label>

                  <Textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Reply with next action, approval note, or clarification..."
                    rows={3}
                    className="mt-2"
                  />

                  <Button className="mt-2 w-full" onClick={sendReply}>
                    Send Reply
                  </Button>
                </div>
              )}

              {sel.id === "PR-2025-0458" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-semibold mb-2">Items</div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span>HPLC System</span>
                      <span>Rs. 6,01,750</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analytical Balance</span>
                      <span>Rs. 2,65,600</span>
                    </div>
                    <div className="flex justify-between">
                      <span>pH Meter</span>
                      <span>Rs. 1,66,000</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs font-semibold mb-2">Approvers</div>

                <div className="space-y-2">
                  {(sel.taskTitle
                    ? [
                        {
                          n: sel.approverName ?? "Approval Team",
                          r: "Department Head",
                        },
                      ]
                    : [
                        { n: "Siddarth Pa", r: "Tech Head" },
                        { n: "Dr. Ragul", r: "Admin" },
                      ]
                  ).map((person) => (
                    <div
                      key={person.n}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {person.n
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="text-sm">{person.n}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {person.r}
                          </div>
                        </div>
                      </div>

                      <StatusBadge
                        status={
                          sel.status === "pending" ? "pending" : sel.status
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {canApprove ? (
                sel.status === "pending" || sel.status === "escalated" ? (
                  <>
                    <div className="mt-4">
                      <Label>Approval Note</Label>
                      <Textarea
                        value={decisionReason}
                        onChange={(event) => setDecisionReason(event.target.value)}
                        placeholder="Enter approval rationale, rejection reason, or required changes..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <Button size="sm" onClick={() => act("approved")}>
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act("changes")}
                      >
                        Changes
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => act("rejected")}
                      >
                        Reject
                      </Button>

                      <Button size="sm" variant="outline" onClick={escalate}>
                        Escalate
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4">
                    <StatusBadge status={sel.status} />
                  </div>
                )
              ) : (
                <div className="mt-4">
                  <Badge variant="outline">View Only</Badge>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a request to view details.
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}