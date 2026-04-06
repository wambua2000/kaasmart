import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import AnimatedSection from "@/components/layout/AnimatedSection";
import { 
  Building2, Users, Wallet, Wrench, MessageSquare, BarChart3,
  CheckCircle, AlertTriangle, Shield, Clock, TrendingUp, UserCheck
} from "lucide-react";
import heroApartment from "@/assets/hero-apartment.jpg";
import { useLanguage } from "@/lib/i18n";

const HomePage = () => {
  const { t } = useLanguage();

  const problems = [
    { icon: AlertTriangle, title: t("home.problems.records"), description: t("home.problems.recordsDesc") },
    { icon: Clock, title: t("home.problems.scale"), description: t("home.problems.scaleDesc") },
    { icon: MessageSquare, title: t("home.problems.communication"), description: t("home.problems.communicationDesc") },
    { icon: BarChart3, title: t("home.problems.visibility"), description: t("home.problems.visibilityDesc") },
    { icon: Wrench, title: t("home.problems.maintenance"), description: t("home.problems.maintenanceDesc") },
    { icon: Shield, title: t("home.problems.security"), description: t("home.problems.securityDesc") },
  ];

  const solutions = [
    { icon: Building2, title: t("home.solution.dashboards"), description: t("home.solution.dashboardsDesc") },
    { icon: Wallet, title: t("home.solution.rent"), description: t("home.solution.rentDesc") },
    { icon: Wrench, title: t("home.solution.workflows"), description: t("home.solution.workflowsDesc") },
    { icon: Shield, title: t("home.solution.access"), description: t("home.solution.accessDesc") },
    { icon: BarChart3, title: t("home.solution.reporting"), description: t("home.solution.reportingDesc") },
    { icon: MessageSquare, title: t("home.solution.messaging"), description: t("home.solution.messagingDesc") },
  ];

  const users = [
    { title: t("home.users.owners"), icon: Building2, points: [t("home.users.owners.1"), t("home.users.owners.2"), t("home.users.owners.3")] },
    { title: t("home.users.managers"), icon: UserCheck, points: [t("home.users.managers.1"), t("home.users.managers.2"), t("home.users.managers.3")] },
    { title: t("home.users.agents"), icon: Wallet, points: [t("home.users.agents.1"), t("home.users.agents.2"), t("home.users.agents.3")] },
    { title: t("home.users.tenants"), icon: Users, points: [t("home.users.tenants.1"), t("home.users.tenants.2"), t("home.users.tenants.3")] },
  ];

  const benefits = [t("home.benefits.1"), t("home.benefits.2"), t("home.benefits.3"), t("home.benefits.4"), t("home.benefits.5")];

  return (
    <PublicLayout>
      <AnimatedSection className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroApartment})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">{t("home.hero.title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">{t("home.hero.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button size="lg" asChild><Link to="/login">{t("home.hero.cta")}</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/support">{t("home.hero.demo")}</Link></Button>
            </div>
          </div>
          <div className="mt-10 lg:mt-12">
            <Card className="bg-card/80 backdrop-blur border-2 border-primary/20 shadow-xl max-w-4xl">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Building2, value: "12", label: t("home.stats.properties") },
                    { icon: TrendingUp, value: "94%", label: t("home.stats.occupancy") },
                    { icon: Wallet, value: "KES 2.4M", label: t("home.stats.rent") },
                    { icon: Wrench, value: "3", label: t("home.stats.pending") },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-primary/10">
                      <stat.icon className="h-7 w-7 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-in-up" delay={100} className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">{t("home.problems.title")}</h2>
            <p className="text-muted-foreground">{t("home.problems.desc")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((problem, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-5">
                  <problem.icon className="h-9 w-9 text-destructive mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-6 text-lg"><strong>{t("home.problems.footer")}</strong></p>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-in-up" delay={100} className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">{t("home.solution.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("home.solution.desc")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {solutions.map((feature, i) => (
              <Card key={i} className="border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <feature.icon className="h-9 w-9 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-in-up" delay={100} className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">{t("home.users.title")}</h2>
            <p className="text-muted-foreground">{t("home.users.desc")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {users.map((user, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10"><user.icon className="h-6 w-6 text-primary" /></div>
                    <h3 className="text-xl font-semibold text-foreground">{user.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {user.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="scale-in" delay={100} className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">{t("home.benefits.title")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {benefits.map((benefit, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow border-primary/20">
                <CardContent className="p-5">
                  <CheckCircle className="h-9 w-9 text-primary mx-auto mb-2" />
                  <p className="font-medium text-foreground">{benefit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-in-up" className="py-12 lg:py-16 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">{t("home.cta.title")}</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">{t("home.cta.desc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild><Link to="/login">{t("home.hero.cta")}</Link></Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/support">{t("home.hero.demo")}</Link>
            </Button>
          </div>
        </div>
      </AnimatedSection>
    </PublicLayout>
  );
};

export default HomePage;
