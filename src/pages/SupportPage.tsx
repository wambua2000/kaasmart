import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { 
  MessageCircle, 
  Mail, 
  BookOpen, 
  GraduationCap,
  FileQuestion,
  CheckCircle,
  Clock,
  ArrowRight,
  Headphones
} from "lucide-react";

const SupportPage = () => {
  return (
    <PublicLayout>
      {/* HEADER */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
              <Headphones className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              We're Here to Help
            </h1>
            <p className="text-lg text-muted-foreground">
              Get the support you need to make the most of KaaSmart Property Manager.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1: SUPPORT CHANNELS */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Support Channels
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple ways to get help, tailored to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="p-4 rounded-full bg-primary/10 inline-flex mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI Chatbot</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get instant answers to common questions 24/7. Our AI assistant can help 
                  with basic troubleshooting and navigation.
                </p>
                <p className="text-xs text-muted-foreground">Available in the app</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-primary">
              <CardContent className="p-8">
                <div className="p-4 rounded-full bg-primary/10 inline-flex mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Email Support</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  For complex issues or detailed inquiries, our support team is ready 
                  to help via email.
                </p>
                <a 
                  href="mailto:support@kaasmart.com" 
                  className="text-primary hover:underline text-sm font-medium"
                >
                  support@kaasmart.com
                </a>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="p-4 rounded-full bg-primary/10 inline-flex mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Help Center</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Browse our comprehensive knowledge base with guides, tutorials, 
                  and best practices.
                </p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 2: ONBOARDING SUPPORT */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Onboarding Support
              </h2>
              <p className="text-muted-foreground">
                We make sure you start on the right foot.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <CardTitle>Step-by-Step Setup</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Our guided setup process walks you through:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Creating your first property",
                      "Adding rooms and setting rent amounts",
                      "Inviting managers and tenants",
                      "Understanding your dashboard"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle>Tutorials & Guides</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Learn at your own pace with our resources:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Video walkthroughs for each feature",
                      "Written guides with screenshots",
                      "Best practices from experienced users",
                      "Tips for maximizing efficiency"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileQuestion className="h-6 w-6 text-primary" />
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Our FAQ section covers the most common questions about account setup, 
                    billing, features, and troubleshooting. Check there first for quick answers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ISSUE RESOLUTION PROCESS */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Issue Resolution Process
              </h2>
              <p className="text-muted-foreground">
                When you contact us, here's how we handle your request.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Submit Your Request",
                  description: "Describe your issue via email or the in-app chatbot. Include as much detail as possible."
                },
                {
                  step: 2,
                  title: "Ticket Created",
                  description: "We create a support ticket and send you a confirmation with a reference number."
                },
                {
                  step: 3,
                  title: "Team Review",
                  description: "Our support team reviews your request and may ask clarifying questions."
                },
                {
                  step: 4,
                  title: "Resolution",
                  description: "We provide a solution, workaround, or escalate to our technical team if needed."
                },
                {
                  step: 5,
                  title: "Follow-Up",
                  description: "We confirm the issue is resolved and close the ticket. Your feedback helps us improve."
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <Card className="mt-12 border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <Clock className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Response Times</h4>
                  <p className="text-sm text-muted-foreground">
                    Standard support: 24-48 hours. Priority support (Professional & Enterprise): 4-12 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Need a Demo?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Schedule a personalized walkthrough with our team to see KaaSmart in action.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="mailto:demo@kaasmart.com">
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SupportPage;
