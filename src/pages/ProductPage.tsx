import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  Building2, 
  Users, 
  Wallet, 
  Wrench, 
  MessageSquare, 
  BarChart3,
  Settings,
  Eye,
  UserCheck
} from "lucide-react";

const ProductPage = () => {
  return (
    <PublicLayout>
      {/* SECTION 1: PLATFORM OVERVIEW */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              The Complete Property Management Platform
            </h1>
            <p className="text-lg text-muted-foreground">
              KaaSmart is a role-based, cloud-hosted property management system designed to digitize 
              the entire property lifecycle — from onboarding tenants to rent collection and reporting.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE MODULES */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Core Modules
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage properties efficiently, all in one integrated system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Property & Unit Management",
                features: [
                  "Register properties and units with details",
                  "Track room status (occupied / vacant)",
                  "Store property images and location data",
                  "Manage multiple properties from one dashboard"
                ]
              },
              {
                icon: Users,
                title: "Tenant Management",
                features: [
                  "Complete tenant profiles and contacts",
                  "Room assignment and history",
                  "Lease documentation storage",
                  "Tenant onboarding workflows"
                ]
              },
              {
                icon: Wallet,
                title: "Rent & Payments",
                features: [
                  "Rent sheets generated automatically",
                  "Payment status tracking in real-time",
                  "Arrears visibility and alerts",
                  "Payment history and receipts"
                ]
              },
              {
                icon: Wrench,
                title: "Maintenance Management",
                features: [
                  "Tenant-submitted maintenance requests",
                  "Approval workflows for repairs",
                  "Status tracking through completion",
                  "Maintenance history per unit"
                ]
              },
              {
                icon: MessageSquare,
                title: "Messaging & Notifications",
                features: [
                  "Structured in-system communication",
                  "Role-based messaging permissions",
                  "Notification alerts for important events",
                  "Reduced reliance on external apps"
                ]
              },
              {
                icon: BarChart3,
                title: "Reports & Analytics",
                features: [
                  "Monthly and yearly reports",
                  "Performance summaries and trends",
                  "Exportable data in multiple formats",
                  "Custom report generation"
                ]
              }
            ].map((module, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: DASHBOARD BREAKDOWN */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Role-Based Dashboards
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every user gets a customized dashboard designed for their specific responsibilities and needs.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                icon: Settings,
                role: "Developer Dashboard",
                color: "bg-purple-500/10 text-purple-600",
                description: "System administration and platform oversight",
                capabilities: [
                  "Manage property owner accounts",
                  "Monitor platform usage and health",
                  "Track system uptime and performance",
                  "Access administrative controls"
                ]
              },
              {
                icon: Building2,
                role: "Property Owner Dashboard",
                color: "bg-blue-500/10 text-blue-600",
                description: "Complete portfolio management and control",
                capabilities: [
                  "Multi-property portfolio view",
                  "Occupancy and vacancy analytics",
                  "Maintenance approvals and oversight",
                  "Report generation and exports"
                ]
              },
              {
                icon: Wallet,
                role: "Financial Agent Dashboard",
                color: "bg-green-500/10 text-green-600",
                description: "Rent collection and financial tracking",
                capabilities: [
                  "Rent collection records",
                  "Payment confirmation and receipts",
                  "Financial summaries and reports",
                  "Limited access (no tenant personal data)"
                ]
              },
              {
                icon: UserCheck,
                role: "Manager / Caretaker Dashboard",
                color: "bg-amber-500/10 text-amber-600",
                description: "Operational oversight and tenant management",
                capabilities: [
                  "Assigned property view",
                  "Tenant listing (limited edit access)",
                  "View-only rent and maintenance data",
                  "Task management and updates"
                ]
              },
              {
                icon: Users,
                role: "Tenant Dashboard",
                color: "bg-teal-500/10 text-teal-600",
                description: "Personal rental information and requests",
                capabilities: [
                  "Room details and rent amount",
                  "Maintenance request submission",
                  "Message property owner directly",
                  "View payment history"
                ]
              }
            ].map((dashboard, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className={`p-4 rounded-lg ${dashboard.color} shrink-0 self-start`}>
                      <dashboard.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">{dashboard.role}</h3>
                      <p className="text-muted-foreground mb-4">{dashboard.description}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {dashboard.capabilities.map((cap, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Eye className="h-4 w-4 text-primary shrink-0" />
                            <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default ProductPage;
