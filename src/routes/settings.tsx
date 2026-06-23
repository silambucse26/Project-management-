import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { currentUser, role } = useApp();
  return (
    <AppLayout title="Settings" badge="Account" subtitle="Manage your workspace preferences">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card className="p-6 max-w-2xl">
            <h3 className="font-semibold mb-4">Profile</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input defaultValue={currentUser.name} /></div>
              <div><Label>Email</Label><Input defaultValue={currentUser.email} /></div>
              <div><Label>Department</Label><Input defaultValue={currentUser.department} /></div>
              <div><Label>Role</Label><Input defaultValue={role} disabled /></div>
            </div>
            <Button className="mt-4" onClick={()=>toast.success("Profile updated")}>Save Changes</Button>
          </Card>
        </TabsContent>
        <TabsContent value="workspace" className="mt-4">
          <Card className="p-6 max-w-2xl space-y-3">
            <div className="flex items-center justify-between"><div><div className="font-medium">Compact mode</div><div className="text-xs text-muted-foreground">Denser tables and cards</div></div><Switch /></div>
            <div className="flex items-center justify-between"><div><div className="font-medium">Auto-archive completed</div><div className="text-xs text-muted-foreground">After 30 days</div></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><div className="font-medium">Show weekend deadlines</div><div className="text-xs text-muted-foreground">Include Sat/Sun in calendar</div></div><Switch /></div>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card className="p-6 max-w-2xl space-y-3">
            {["Email summaries","Task assignments","Approval requests","Mentions in comments","Deadline reminders"].map(n=>(
              <div key={n} className="flex items-center justify-between"><span>{n}</span><Switch defaultChecked /></div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div><Label>Current Password</Label><Input type="password" /></div>
            <div><Label>New Password</Label><Input type="password" /></div>
            <Button onClick={()=>toast.success("Password updated")}>Update Password</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
