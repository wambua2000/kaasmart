import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  FileCheck, 
  Server,
  UserCheck,
  RefreshCw,
  Database,
  CheckCircle
} from "lucide-react";

const SecurityPage = () => {
  return (
    <PublicLayout>
      {/* SECTION 1: SECURITY PRINCIPLES */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Security First
            </h1>
            <p className="text-lg text-muted-foreground">
              Security is built into every layer of KaaSmart. We protect your data with 
              industry-standard practices and transparent policies.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: TECHNICAL SECURITY */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Technical Security Measures
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple layers of protection keep your property and tenant data safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: UserCheck,
                title: "Role-Based Permissions",
                description: "Every user only sees and accesses what they need. Owners, managers, agents, and tenants each have carefully controlled access levels."
              },
              {
                icon: Lock,
                title: "Encrypted Data Transmission",
                description: "All data transmitted between your device and our servers is encrypted using TLS 1.3, the latest security standard."
              },
              {
                icon: Key,
                title: "Multi-Factor Authentication",
                description: "Add an extra layer of security to your account with optional two-factor authentication (2FA)."
              },
              {
                icon: Eye,
                title: "Audit Logs",
                description: "Every action in the system is logged and can be reviewed. Know who did what and when."
              },
              {
                icon: RefreshCw,
                title: "Regular Backups",
                description: "Your data is automatically backed up multiple times daily with point-in-time recovery options."
              },
              {
                icon: Server,
                title: "Secure Infrastructure",
                description: "Hosted on enterprise-grade cloud infrastructure with 99.9% uptime guarantee and DDoS protection."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-lg bg-primary/10 inline-flex mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPLIANCE */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Compliance & Standards
              </h2>
              <p className="text-muted-foreground">
                KaaSmart is designed to meet regulatory requirements in our operating regions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Kenya Data Protection Act (2019)
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        KaaSmart complies with the Kenya Data Protection Act, ensuring that personal 
                        data is collected, processed, and stored in accordance with Kenyan law. 
                        We respect data subject rights including access, rectification, and erasure.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        GDPR-Aligned Architecture
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Our system architecture follows GDPR principles, making it ready for 
                        European markets. This includes data minimization, purpose limitation, 
                        and privacy by design.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: DATA OWNERSHIP */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="p-6 rounded-full bg-primary/10">
                    <Database className="h-16 w-16 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Your Data, Your Control
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      You retain full ownership and control of your data at all times. 
                      We are custodians, not owners, of your information.
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Export your data at any time in standard formats",
                        "Request deletion of your data when you leave",
                        "We never sell or share your data with third parties",
                        "Transparent data processing policies"
                      ].map((point, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SecurityPage;
