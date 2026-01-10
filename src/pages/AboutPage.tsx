import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  Target, 
  Eye, 
  Users, 
  Building2, 
  Briefcase,
  Smartphone,
  Brain,
  CreditCard,
  Wifi,
  Home,
  CheckCircle
} from "lucide-react";

const AboutPage = () => {
  return (
    <PublicLayout>
      {/* SECTION 1: ABOUT KAASMART */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              About KaaSmart
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              KaaSmart was built to modernize property management in regions where manual 
              systems still dominate. We believe technology should simplify operations, 
              not complicate them.
            </p>
            <p className="text-muted-foreground">
              Born in Africa, designed for global scale, KaaSmart addresses the real challenges 
              faced by property owners, managers, and tenants every day. Our platform replaces 
              paper ledgers, scattered spreadsheets, and fragmented communication with a 
              unified, secure, and intuitive system.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: MISSION & VISION */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To digitize property operations across Africa and beyond, making professional 
                  property management accessible to landlords of all sizes. We aim to eliminate 
                  the inefficiencies of manual systems and bring transparency to every 
                  property transaction.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  A world where every property stakeholder — from small landlords to large 
                  developers — has access to powerful, affordable tools that increase 
                  transparency, improve accountability, and empower better decision-making.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-xl font-semibold text-primary text-center mb-5">Our Core Values</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "Transparency", desc: "Clear visibility into all operations" },
                { title: "Simplicity", desc: "Powerful features, easy to use" },
                { title: "Reliability", desc: "Dependable systems you can trust" }
              ].map((value, index) => (
                <Card key={index} className="text-center border-primary/20">
                  <CardContent className="p-5">
                    <CheckCircle className="h-7 w-7 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TARGET USERS */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Who We Serve
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              KaaSmart is designed for everyone in the property ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardContent className="p-5 text-center">
                <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Individual Landlords</h3>
                <p className="text-muted-foreground text-sm">
                  Small property owners managing 1-10 rental units who want to professionalize 
                  their operations without expensive software.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardContent className="p-5 text-center">
                <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
                  <Briefcase className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Property Management Firms</h3>
                <p className="text-muted-foreground text-sm">
                  Companies managing multiple properties on behalf of owners who need 
                  scalable, multi-user solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardContent className="p-5 text-center">
                <div className="p-3 rounded-full bg-primary/10 inline-flex mb-3">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Real Estate Developers</h3>
                <p className="text-muted-foreground text-sm">
                  Developers building and managing large residential or commercial 
                  portfolios requiring enterprise-grade features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 4: FUTURE ROADMAP */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                Future Roadmap
              </h2>
              <p className="text-muted-foreground">
                We're constantly evolving. Here's what's coming next.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Smartphone,
                  title: "Mobile Apps",
                  description: "Native iOS and Android apps for property management on the go. Push notifications for payments and maintenance."
                },
                {
                  icon: Brain,
                  title: "AI Analytics",
                  description: "Predictive analytics for rent pricing, vacancy forecasting, and maintenance scheduling."
                },
                {
                  icon: CreditCard,
                  title: "Payment Integrations",
                  description: "Direct mobile money and bank integration for seamless rent collection across Africa."
                },
                {
                  icon: Wifi,
                  title: "Offline Mode",
                  description: "Work without internet and sync when connected. Perfect for areas with unreliable connectivity."
                },
                {
                  icon: Home,
                  title: "Smart Property Integration",
                  description: "Connect with smart locks, meters, and IoT devices for automated property monitoring."
                },
                {
                  icon: Building2,
                  title: "Multi-Country Expansion",
                  description: "Localized versions for different African markets with local currency and compliance support."
                }
              ].map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground">
                Have a feature request? <a href="mailto:feedback@kaasmart.com" className="text-primary hover:underline font-medium">Let us know</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default AboutPage;