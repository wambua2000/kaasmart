import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  UserPlus, 
  Building2, 
  Users, 
  LayoutDashboard,
  Wallet,
  Wrench,
  MessageSquare,
  BarChart3,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  Clock
} from "lucide-react";

const HowItWorksPage = () => {
  return (
    <PublicLayout>
      {/* HEADER */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              How KaaSmart Works
            </h1>
            <p className="text-lg text-muted-foreground">
              From setup to daily operations, KaaSmart streamlines every step of property management.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1: ONBOARDING FLOW */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Getting Started: Onboarding Flow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Set up your entire property management system in four simple steps.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />
              
              <div className="space-y-5">
                {[
                  {
                    step: 1,
                    icon: UserPlus,
                    title: "Developer Creates Owner Accounts",
                    description: "The system developer sets up and manages property owner accounts, ensuring proper access and configuration."
                  },
                  {
                    step: 2,
                    icon: Building2,
                    title: "Owner Adds Properties and Units",
                    description: "Property owners register their properties, add rooms/units, set rent amounts, and upload property details."
                  },
                  {
                    step: 3,
                    icon: Users,
                    title: "Owner Invites Team Members",
                    description: "Owners invite managers, financial agents, and tenants to the system with appropriate role-based permissions."
                  },
                  {
                    step: 4,
                    icon: LayoutDashboard,
                    title: "Users Access Their Dashboards",
                    description: "Each user logs in and accesses their personalized dashboard with features relevant to their role."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-5 items-start">
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    <Card className="flex-1 hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <item.icon className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DAILY OPERATIONS FLOW */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Daily Operations Flow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Once set up, KaaSmart handles daily operations seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Wallet,
                title: "Rent Tracking",
                description: "Rent status is tracked automatically with every payment recorded in the system."
              },
              {
                icon: Wrench,
                title: "Maintenance Workflows",
                description: "Requests follow structured approval processes from submission to completion."
              },
              {
                icon: MessageSquare,
                title: "In-System Messaging",
                description: "All communication stays organized within the platform for easy reference."
              },
              {
                icon: BarChart3,
                title: "Real-Time Reports",
                description: "Reports update automatically as data changes, always showing current status."
              }
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: MAINTENANCE REQUEST FLOW */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Maintenance Request Flow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A detailed look at how maintenance requests are handled from start to finish.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              {[
                { step: "1", title: "Tenant Submits", desc: "Tenant reports issue through their dashboard" },
                { step: "2", title: "Manager Reviews", desc: "Manager views and logs the request details" },
                { step: "3", title: "Owner Approves", desc: "Property owner reviews and approves repair" },
                { step: "4", title: "Repair Executed", desc: "Maintenance work is carried out" },
                { step: "5", title: "Status Updated", desc: "All parties see the completed status" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 w-full lg:w-auto">
                  <Card className="flex-1 lg:w-44 hover:shadow-lg transition-shadow border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-2">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </CardContent>
                  </Card>
                  {index < 4 && (
                    <ArrowRight className="h-5 w-5 text-primary hidden lg:block shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Key Benefits of This Workflow
                </h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Transparency:</strong> Everyone involved can track the request status at any time.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Accountability:</strong> Clear ownership at each step ensures nothing falls through the cracks.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Documentation:</strong> Complete history of all requests is automatically maintained.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 4: REAL-TIME DATA SYNC */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                Real-Time Data Synchronization
              </h2>
              <p className="text-muted-foreground">
                Changes made by any user are instantly reflected across all dashboards.
              </p>
            </div>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-5 rounded-full bg-primary/10">
                    <RefreshCw className="h-14 w-14 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      How It Works
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>When a payment is recorded, the tenant's balance updates immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>When a room is assigned, occupancy statistics refresh across all dashboards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>When a maintenance request is approved, the tenant sees the update instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>Reports always show the most current data without manual refresh</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                <strong className="text-foreground">No duplication. No delays. No confusion.</strong><br />
                Everyone works from the same accurate, up-to-date information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HowItWorksPage;