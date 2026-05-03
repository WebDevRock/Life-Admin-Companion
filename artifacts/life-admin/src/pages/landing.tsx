import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-tight">
            One calm place for your everyday admin
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Life Admin Companion helps you keep track of the boring but important things: bills, renewals, warranties, documents, appointments, and deadlines. It is designed to reduce stress, avoid missed dates, and give you one calm place for everyday admin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          {isAuthenticated ? (
            <Button asChild size="lg" className="w-full sm:w-auto text-lg" data-testid="btn-go-dashboard">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => login()} className="w-full sm:w-auto text-lg" data-testid="btn-start-organising">
                Start organising
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto text-lg bg-card hover:bg-muted" data-testid="btn-example-dashboard">
                <Link href="/dashboard">See example dashboard</Link>
              </Button>
            </>
          )}
        </div>

        <div className="pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-medium">
            <Shield className="w-4 h-4" />
            <p>
              Your life admin records are private to your account. This app is designed to help you stay organised, not to sell your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
