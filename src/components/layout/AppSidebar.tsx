import { ExternalLink, Wrench, MessageSquare, FileText, KeyRound, Mail, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  onOpenSheet: () => void;
  onOpenMaintenance: () => void;
  onOpenMessageCenter: () => void;
  onGenerateReport: () => void;
  onPasswordReset?: () => void;
  onInviteManager?: () => void;
  onAddProperty?: () => void;
  userRole: "owner" | "manager";
}

export function AppSidebar({
  onOpenSheet,
  onOpenMaintenance,
  onOpenMessageCenter,
  onGenerateReport,
  onPasswordReset,
  onInviteManager,
  onAddProperty,
  userRole,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border/50 bg-card/80 backdrop-blur-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenSheet}>
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Sheet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenMaintenance}>
                  <Wrench className="h-4 w-4" />
                  <span>Maintenance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenMessageCenter}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Message Centre</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onGenerateReport}>
                  <FileText className="h-4 w-4" />
                  <span>Generate Report</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "owner" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onPasswordReset}>
                      <KeyRound className="h-4 w-4" />
                      <span>Password Resets</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onInviteManager}>
                      <Mail className="h-4 w-4" />
                      <span>Invite Manager</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onAddProperty} className="text-primary font-medium">
                      <Plus className="h-4 w-4" />
                      <span>Add Property</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
