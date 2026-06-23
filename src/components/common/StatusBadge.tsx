import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "on-track": "bg-success/15 text-success border-success/20",
  "at-risk": "bg-warning/20 text-warning border-warning/30",
  delayed: "bg-destructive/15 text-destructive border-destructive/20",
  completed: "bg-info/15 text-info border-info/20",
  backlog: "bg-muted text-muted-foreground border-border",
  "in-progress": "bg-primary/15 text-primary border-primary/20",
  "in-review": "bg-purple/15 text-purple border-purple/20",
  blocked: "bg-destructive/15 text-destructive border-destructive/20",
  changes: "bg-purple/15 text-purple border-purple/20",
  approved: "bg-success/15 text-success border-success/20",
  "not-submitted": "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
  changes: "bg-purple/15 text-purple border-purple/20",
  escalated: "bg-warning/20 text-warning border-warning/30",
};

const labels: Record<string, string> = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  delayed: "Delayed",
  completed: "Completed",
  backlog: "Backlog",
  "in-progress": "In Progress",
  "in-review": "In Review",
  blocked: "Blocked",
  changes: "Changes Requested",
  approved: "Approved",
  "not-submitted": "Not Submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  changes: "Changes Requested",
  escalated: "Escalated",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status] ?? "")}>
      {labels[status] ?? status}
    </Badge>
  );
}

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/15 text-info border-info/20",
  high: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/20",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", priorityStyles[priority] ?? "")}>
      {priority}
    </Badge>
  );
}
