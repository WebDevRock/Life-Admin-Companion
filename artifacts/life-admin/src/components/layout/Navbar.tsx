import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LogIn, LogOut, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
          <CheckSquare className="h-5 w-5" />
          <span>Life Admin Companion</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/dashboard" className={location === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}>
                  Dashboard
                </Link>
                <Link href="/items" className={location === "/items" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}>
                  Items
                </Link>
                <Link href="/costs" className={location === "/costs" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}>
                  Costs
                </Link>
                <Link href="/archived" className={location === "/archived" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}>
                  Archived
                </Link>
                <Link href="/about" className={location === "/about" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}>
                  About
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="btn-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => login()} data-testid="btn-login">
              <LogIn className="h-4 w-4 mr-2" />
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
