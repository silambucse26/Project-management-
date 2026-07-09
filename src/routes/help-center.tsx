import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Headphones,
  Laptop,
  Lightbulb,
  Package,
  Send,
  ShieldAlert,
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

type RequestStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";
type RequestPriority = "Low" | "Medium" | "High" | "Urgent";

type HelpRequest = {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  submittedBy: string;
  department: string;
  createdAt: string;
};

const categories = [
  {
    name: "Technical Issue",
    icon: Wrench,
    description: "Computer, printer, software, internet, login, or email problems.",
  },
  {
    name: "Production Request",
    icon: Building2,
    description: "Request raw materials, tools, machines, safety items, or production support.",
  },
  {
    name: "Workplace Complaint",
    icon: AlertTriangle,
    description: "Report AC, electricity, water, cleanliness, cafeteria, furniture, or office issues.",
  },
  {
    name: "HR Request",
    icon: UserRound,
    description: "Leave, salary, attendance, ID card, benefits, or document requests.",
  },
  {
    name: "IT Support",
    icon: Laptop,
    description: "Password reset, VPN access, new laptop, software installation, or email setup.",
  },
  {
    name: "Inventory Request",
    icon: Package,
    description: "Stationery, printer paper, monitor, keyboard, mouse, chair, or office items.",
  },
  {
    name: "Suggestion",
    icon: Lightbulb,
    description: "Share ideas to improve workflow, production, office process, or cost savings.",
  },
  {
    name: "Safety Incident",
    icon: ShieldAlert,
    description: "Report unsafe machinery, fire hazard, accident, near miss, or safety concern.",
  },
  {
    name: "Transport Request",
    icon: Truck,
    description: "Company vehicle, delivery support, driver request, or transport assistance.",
  },
];

function HelpCenterPage() {
  const { currentUser } = useApp();

  const [category, setCategory] = useState("Technical Issue");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("Medium");

  const [requests, setRequests] = useState<HelpRequest[]>([
    {
      id: "REQ-1001",
      category: "IT Support",
      title: "Email login issue",
      description: "Unable to access office email from the new system.",
      priority: "High",
      status: "In Progress",
      submittedBy: currentUser.name,
      department: currentUser.department,
      createdAt: "2026-07-09T09:30:00",
    },
    {
      id: "REQ-1002",
      category: "Production Request",
      title: "Need safety gloves",
      description: "Production team needs safety gloves for machine operation.",
      priority: "Medium",
      status: "Pending",
      submittedBy: currentUser.name,
      department: currentUser.department,
      createdAt: "2026-07-09T10:15:00",
    },
  ]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.name === category),
    [category]
  );

  function handleSubmitRequest() {
    if (!title.trim()) {
      toast.error("Please enter a request title.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe your issue or request.");
      return;
    }

    const newRequest: HelpRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "Pending",
      submittedBy: currentUser.name,
      department: currentUser.department,
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newRequest, ...prev]);
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
          <TabsTrigger value="raise-request">Raise Request</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="raise-request" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
            <Card className="p-5">
              <h3 className="font-semibold text-lg">Raise a New Request</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a category and submit your complaint, requirement, or support request.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = category === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCategory(item.name)}
                      className={`text-left rounded-xl border p-4 transition ${
                        active
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-5 mb-3 text-primary" />
                      <div className="font-medium text-sm">{item.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Selected Category</Label>
                  <Input value={category} readOnly />
                </div>

                <div>
                  <Label>Request Title</Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Need printer repair in office"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explain the issue, requirement, location, quantity, or inconvenience..."
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <Label>Priority</Label>
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as RequestPriority)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <Button onClick={handleSubmitRequest}>
                  <Send className="size-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  {selectedCategory ? (
                    <selectedCategory.icon className="size-6 text-primary" />
                  ) : (
                    <Headphones className="size-6 text-primary" />
                  )}

                  <div>
                    <h3 className="font-semibold">{category}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCategory?.description}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold">Examples You Can Submit</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>• Office inconvenience or workplace complaint</p>
                  <p>• Requirement for production materials or tools</p>
                  <p>• IT or system access problem</p>
                  <p>• HR, salary, attendance, or document request</p>
                  <p>• Safety issue, accident, or unsafe condition</p>
                  <p>• Suggestion to improve office or production workflow</p>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold">Request Status Meaning</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><Badge variant="secondary">Pending</Badge> Waiting for review</p>
                  <p><Badge variant="secondary">In Progress</Badge> Being handled</p>
                  <p><Badge variant="secondary">Resolved</Badge> Completed</p>
                  <p><Badge variant="secondary">Rejected</Badge> Not approved</p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-requests" className="mt-5">
          <Card className="p-5">
            <h3 className="font-semibold text-lg">My Requests</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track complaints, support tickets, and office requirements submitted by you.
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4">Request ID</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Priority</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Submitted On</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b">
                      <td className="py-3 pr-4 font-medium">{request.id}</td>
                      <td className="py-3 pr-4">{request.category}</td>
                      <td className="py-3 pr-4">{request.title}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{request.priority}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{request.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["IT Support", "itsupport@chimertech.com", "Ext. 220"],
              ["HR Department", "hr@chimertech.com", "Ext. 205"],
              ["Production Manager", "production@chimertech.com", "Ext. 310"],
              ["Administration", "admin@chimertech.com", "Ext. 100"],
            ].map(([name, email, phone]) => (
              <Card key={name} className="p-5">
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{email}</p>
                <p className="text-sm text-muted-foreground">{phone}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 mt-5 border-destructive/30">
            <h3 className="font-semibold text-destructive">Emergency Contacts</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mt-3 text-sm">
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