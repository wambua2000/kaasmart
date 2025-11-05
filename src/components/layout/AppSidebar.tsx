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
  onOpenSheet?: () => void;
  onOpenMaintenance?: () => void;
  onOpenMessageCenter?: () => void;
  onGenerateReport?: () => void;
  onPasswordReset?: () => void;
  onInviteManager?: () => void;
  onInviteAgent?: () => void;
  onViewLeaseAgreements?: () => void;
  onAddProperty?: () => void;
  userRole: "owner" | "manager" | "agent";
  pendingResetCount?: number;
  maintenanceCount?: number;
  messageCount?: number;
}

export function AppSidebar({
  onOpenSheet,
  onOpenMaintenance,
  onOpenMessageCenter,
  onGenerateReport,
  onPasswordReset,
  onInviteManager,
  onInviteAgent,
  onViewLeaseAgreements,
  onAddProperty,
  userRole,
  pendingResetCount = 0,
  maintenanceCount = 0,
  messageCount = 0,
}: AppSidebarProps) {
  const { state } = useSidebar();
  
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/50">
      <SidebarContent className="bg-blue-900">
        <SidebarGroup className="rounded-lg mx-2 mt-2">
          <SidebarGroupLabel className="text-white font-semibold">Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(userRole === "owner" || userRole === "agent") && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenSheet} className="text-white hover:bg-blue-800 hover:text-white">
                    <ExternalLink className="h-4 w-4" />
                    <span>Open Sheet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenMaintenance} className="relative text-white hover:bg-blue-800 hover:text-white">
                  <Wrench className="h-4 w-4" />
                  <span>Maintenance</span>
                  {maintenanceCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground animate-pulse">
                      {maintenanceCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenMessageCenter} className="relative text-white hover:bg-blue-800 hover:text-white">
                  <MessageSquare className="h-4 w-4" />
                  <span>Message Centre</span>
                  {messageCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground animate-pulse">
                      {messageCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "owner" && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onGenerateReport} className="text-white hover:bg-blue-800 hover:text-white">
                    <FileText className="h-4 w-4" />
                    <span>Generate Report</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {onViewLeaseAgreements && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onViewLeaseAgreements} className="text-white hover:bg-blue-800 hover:text-white">
                    <FileCheck className="h-4 w-4" />
                    <span>Lease Agreements</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === "owner" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onPasswordReset} className="relative text-white hover:bg-blue-800 hover:text-white">
                      <KeyRound className="h-4 w-4" />
                      <span>Password Resets</span>
                      {pendingResetCount > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground animate-pulse">
                          {pendingResetCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {onInviteManager && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={onInviteManager} className="text-white hover:bg-blue-800 hover:text-white">
                        <Mail className="h-4 w-4" />
                        <span>Invite Manager</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {onInviteAgent && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={onInviteAgent} className="text-white hover:bg-blue-800 hover:text-white">
                        <Mail className="h-4 w-4" />
                        <span>Invite Agent</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {onAddProperty && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={onAddProperty} className="text-white hover:bg-blue-800 hover:text-white font-medium">
                        <Plus className="h-4 w-4" />
                        <span>Add Property</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
