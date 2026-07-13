import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import { departments as departmentSeed } from "@/data/mockData";
import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

type ChatMessage = {
  id: string;
  name: string;
  role: string;
  department: string;
  targetDepartment?: string;
  message: string;
  createdAt: string;
};

const MESSAGES_STORAGE_KEY = "chimertech-messages-v1";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    name: "Admin User",
    role: "admin",
    department: "Founder's Office",
    message: "Welcome team. Use this page for project updates and discussions.",
    createdAt: "2026-07-09T09:30:00",
  },
  {
    id: "2",
    name: "Department Head",
    role: "head",
    department: "Tech",
    message: "Please post your daily progress before leaving today.",
    createdAt: "2026-07-09T10:15:00",
  },
  {
    id: "3",
    name: "John Smith",
    role: "member",
    department: "Tech",
    message: "Finished the authentication module.",
    createdAt: "2026-07-08T15:30:00",
  },
];

function readStoredMessages() {
  if (typeof window === "undefined") return initialMessages;
  try {
    const raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return initialMessages;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialMessages;
    return parsed as ChatMessage[];
  } catch {
    return initialMessages;
  }
}

function MessagesPage() {
  const { currentUser, role } = useApp();

  const today = new Date().toISOString().split("T")[0];

  const [message, setMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(role === "admin" ? "all" : currentUser.department);
  const [messageTargetDepartment, setMessageTargetDepartment] = useState(role === "admin" ? "all" : currentUser.department);
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages());
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (role !== "admin") {
      setSelectedDepartment(currentUser.department);
      setMessageTargetDepartment(currentUser.department);
      return;
    }

    if (selectedDepartment !== "all" && !departmentSeed.some((department) => department.name === selectedDepartment)) {
      setSelectedDepartment("all");
    }
  }, [role, currentUser.department, selectedDepartment]);

  useEffect(() => {
    const visibleMessages = messages.filter((chat) => {
      if (role === "admin") {
        return selectedDepartment === "all" || chat.department === selectedDepartment;
      }
      return chat.department === currentUser.department;
    });

    const latestVisibleDate = visibleMessages
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt.split("T")[0];

    setSelectedDate((previousDate) => {
      const previousHasVisibleMessages = visibleMessages.some((chat) => chat.createdAt.split("T")[0] === previousDate);
      return previousHasVisibleMessages ? previousDate : latestVisibleDate ?? today;
    });
  }, [messages, role, selectedDepartment, currentUser.department, today]);

  const departmentOptions = useMemo(() => {
    const departments = departmentSeed.map((item) => item.name);
    return role === "admin"
      ? [{ value: "all", label: "All Departments" }, ...departments.map((name) => ({ value: name, label: name }))]
      : [{ value: currentUser.department, label: currentUser.department }];
  }, [role, currentUser.department]);

  const filteredMessages = useMemo(() => {
    return messages
      .filter((chat) => chat.createdAt.split("T")[0] === selectedDate)
      .filter((chat) => {
        if (role === "admin") {
          const matchesDepartment = selectedDepartment === "all"
            ? chat.targetDepartment === "all" || chat.department === selectedDepartment || chat.targetDepartment === undefined
            : chat.targetDepartment === selectedDepartment || chat.targetDepartment === "all" || chat.department === selectedDepartment;
          return matchesDepartment;
        }
        return chat.targetDepartment === currentUser.department || chat.targetDepartment === "all" || chat.department === currentUser.department;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, selectedDate, role, selectedDepartment, currentUser.department]);

  function handleSendMessage() {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      name: currentUser.name,
      role,
      department: currentUser.department,
      targetDepartment: role === "admin" ? messageTargetDepartment : currentUser.department,
      message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [newMessage, ...prev]);
    setMessage("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
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

          <div className="flex flex-col gap-3 md:flex-row">
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

            {role === "admin" ? (
              <Select value={messageTargetDepartment} onValueChange={setMessageTargetDepartment}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Target department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentSeed.map((department) => (
                    <SelectItem key={department.name} value={department.name}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

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
              Showing {role === "admin" && selectedDepartment !== "all" ? `${selectedDepartment} ` : ""}
              messages for{" "}
              <span className="font-medium">
                {new Date(selectedDate).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {role === "admin" ? (
              <>
                <Label>Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <Badge variant="secondary">{currentUser.department}</Badge>
            )}

            <Label>Select Date</Label>

            <Input
              type="date"
              className="w-44"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
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
                    {new Date(chat.createdAt).toLocaleTimeString([], {
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