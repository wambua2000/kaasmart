import { ExternalLink, Wrench, MessageSquare, FileText, KeyRound, Mail, Plus, FileCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  onOpenSheet: () => void;
  onOpenMaintenance: () => void;
  onOpenMessageCenter: () => void;
  onGenerateReport: () => void;
  onPasswordReset?: () => void;
  onInviteManager?: () => void;
  onViewLeaseAgreements?: () => void;
  onAddProperty?: () => void;
  userRole: "owner" | "manager";
  pendingResetCount?: number;
}

export function AppSidebar({
  onOpenSheet,
  onOpenMaintenance,
  onOpenMessageCenter,
  onGenerateReport,
  onPasswordReset,
  onInviteManager,
  onViewLeaseAgreements,
  onAddProperty,
  userRole,
  pendingResetCount = 0,
}: AppSidebarProps) {
  const { state } = useSidebar();
  
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/50 bg-card/80 backdrop-blur-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userRole === "owner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenSheet}>
                    <ExternalLink className="h-4 w-4" />
                    <span>Open Sheet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

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

              {userRole === "owner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onGenerateReport}>
                    <FileText className="h-4 w-4" />
                    <span>Generate Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {onViewLeaseAgreements && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onViewLeaseAgreements}>
                    <FileCheck className="h-4 w-4" />
                    <span>Lease Agreements</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === "owner" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onPasswordReset} className="relative">
                      <KeyRound className="h-4 w-4" />
                      <span>Password Resets</span>
                      {pendingResetCount > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground animate-pulse">
                          {pendingResetCount}
                        </span>
                      )}
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
