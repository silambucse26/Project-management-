import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/app-store";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

type ChatMessage = {
  id: string;
  sender_id: string;
  name: string;
  role: string;
  department: string;
  message: string;
  created_at: string;
};
function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function MessagesPage() {
  const { currentUser, role } = useApp();

  const today = getLocalDate();

  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      name: "Admin User",
      sender_id: "admin-user-id",
      role: "admin",
      department: "Management",
      message:
        "Welcome team. Use this page for project updates and discussions.",
      created_at: "2026-07-09T09:30:00",
    },
    {
      id: "2",
      name: "Department Head",
      sender_id: "department-head-id",
      role: "head",
      department: "Development",
      message:
        "Please post your daily progress before leaving today.",
      created_at: "2026-07-09T10:15:00",
    },
    {
      id: "3",
      name: "John Smith",
      sender_id: "john-smith-id",
      role: "member",
      department: "Development",
      message: "Finished the authentication module.",
      created_at: "2026-07-08T15:30:00",
    },
  ]);

  const filteredMessages = useMemo(() => {
  return messages
    .filter((chat) => {
      const sameDate =
        getLocalDate(new Date(chat.created_at)) === selectedDate;
      const sameDepartment =
        selectedDepartment === "all" ||
        chat.department === selectedDepartment;

      return sameDate && sameDepartment;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
}, [messages, selectedDate, selectedDepartment]);

  function handleSendMessage() {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      name: currentUser.name,
      sender_id: currentUser.id,
      role,
      department: currentUser.department,
      message: message,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [newMessage, ...prev]);
    setMessage("");
    setSelectedDate(today);
  }

  return (
    <AppLayout
      title="Messages"
      badge="Team Chat"
      subtitle="Collaborate with admins, department heads and team members"
    >
      <div className="max-w-5xl mx-auto space-y-5">

        <Card className="p-5">
          <Label className="mb-2 block">Team Message</Label>

          <div className="flex gap-3">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />

            <Button onClick={handleSendMessage}>
              <Send className="size-4 mr-2" />
              Send
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">
              Team Messages
            </h2>

            <p className="text-sm text-muted-foreground">
              Showing messages for{" "}
              <span className="font-medium">
                {new Date(selectedDate).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">

        {/* Show only for Admin */}
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <Label>Department</Label>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Management">Tech</SelectItem>
                <SelectItem value="Development">Electronics & R&D</SelectItem>
                <SelectItem value="Sales">Sales & Marketing</SelectItem>
                <SelectItem value="Marketing">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Label>Select Date</Label>

          <Input
            type="date"
            className="w-44"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(e.target.value)
            }
          />
        </div>

      </div>
        </div>

        <div className="space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((chat) => (
              <Card
                key={chat.id}
                className="p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {chat.name}
                      </span>

                      <Badge variant="secondary">
                        {chat.role}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {chat.department}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(chat.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed">
                  {chat.message}
                </p>
              </Card>
            ))
          ) : (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">
                No team messages found for this date.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}