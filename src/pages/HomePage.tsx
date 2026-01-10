import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  Building2, 
  Users, 
  Wallet, 
  Wrench, 
  MessageSquare, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  UserCheck
} from "lucide-react";
import heroApartment from "@/assets/hero-apartment.jpg";

const HomePage = () => {
  return (
    <PublicLayout>
      {/* SECTION 1: HERO */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroApartment})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Property Management Made Simple
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              KaaSmart Property Manager is a smart digital platform that helps property owners, 
              managers, financial agents, and tenants manage rent, maintenance, communication, 
              and reporting from one secure system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/support">Request a Demo</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Preview Card */}
          <div className="mt-12 lg:mt-16">
            <Card className="bg-card/80 backdrop-blur border-2 shadow-xl max-w-4xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-foreground">94%</p>
                    <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-500/10">
                    <Wallet className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                    <p className="text-2xl font-bold text-foreground">KES 2.4M</p>
                    <p className="text-sm text-muted-foreground">Rent Collected</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <Wrench className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE REAL PROBLEM */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Challenges of Traditional Property Management
            </h2>
            <p className="text-muted-foreground">
              Property management in Africa still relies heavily on outdated methods that create inefficiencies and risks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: AlertTriangle,
                title: "Missing Records",
                description: "Manual rent tracking leads to missing records and disputes between landlords and tenants."
              },
              {
                icon: Clock,
                title: "Hard to Scale",
                description: "Paper files and spreadsheets are difficult to audit and become unmanageable as properties grow."
              },
              {
                icon: MessageSquare,
                title: "Communication Chaos",
                description: "Using calls and messaging apps causes confusion and lost information."
              },
              {
                icon: BarChart3,
                title: "No Real-Time Visibility",
                description: "Property owners lack instant access to performance data and financial status."
              },
              {
                icon: Wrench,
                title: "Slow Maintenance",
                description: "Tenants experience delayed responses to maintenance requests due to unclear workflows."
              },
              {
                icon: Shield,
                title: "Security Risks",
                description: "Sensitive tenant and financial data is vulnerable without proper digital security."
              }
            ].map((problem, index) => (
              <Card key={index} className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <problem.icon className="h-10 w-10 text-destructive mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 text-lg">
            <strong>These challenges grow worse as properties scale.</strong>
          </p>
        </div>
      </section>

      {/* SECTION 3: THE KAASMART SOLUTION */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              A Centralized, Automated Property Management System
            </h2>
            <p className="text-muted-foreground text-lg">
              KaaSmart brings all property operations into one system where data is accurate, 
              accessible, and updated in real time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Centralized Dashboards",
                description: "Every role gets a customized dashboard with relevant information and actions."
              },
              {
                icon: Wallet,
                title: "Automated Rent Tracking",
                description: "Rent and occupancy status updates automatically with every transaction."
              },
              {
                icon: Wrench,
                title: "Structured Workflows",
                description: "Maintenance requests follow clear approval and execution processes."
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Secure permissions ensure each user only sees what they need."
              },
              {
                icon: BarChart3,
                title: "Transparent Reporting",
                description: "Generate accurate reports for any period with a few clicks."
              },
              {
                icon: MessageSquare,
                title: "In-System Messaging",
                description: "All communication stays organized within the platform."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: WHO USES KAASMART */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Who Uses KaaSmart
            </h2>
            <p className="text-muted-foreground">
              Built for everyone in the property management ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Property Owners",
                icon: Building2,
                points: [
                  "Full control of multiple properties",
                  "Visibility into rent, vacancies, and performance",
                  "Approval authority for maintenance and reports"
                ]
              },
              {
                title: "Managers / Caretakers",
                icon: UserCheck,
                points: [
                  "Operational oversight without financial control",
                  "Clear task visibility and assignments",
                  "Reduced paperwork and manual tracking"
                ]
              },
              {
                title: "Financial Agents",
                icon: Wallet,
                points: [
                  "Rent collection transparency",
                  "Accurate arrears tracking",
                  "Clean financial reporting"
                ]
              },
              {
                title: "Tenants",
                icon: Users,
                points: [
                  "Clear rent information and history",
                  "Easy maintenance request submission",
                  "Direct communication channel with management"
                ]
              }
            ].map((user, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <user.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{user.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {user.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: BENEFITS SUMMARY */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose KaaSmart
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              "Reduced administrative workload",
              "Improved accountability",
              "Faster maintenance resolution",
              "Better tenant satisfaction",
              "Scalable property operations"
            ].map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">{benefit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Start Managing Properties the Smart Way
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join property owners and managers across Africa who are modernizing their operations with KaaSmart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/support">Request a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HomePage;
