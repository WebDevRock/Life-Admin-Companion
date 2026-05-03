import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  LogIn,
  LogOut,
  CheckSquare,
  Menu,
  X,
  LayoutDashboard,
  List,
  TrendingUp,
  Archive,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/items",     label: "Items",     Icon: List },
  { href: "/costs",     label: "Costs",     Icon: TrendingUp },
  { href: "/archived",  label: "Archived",  Icon: Archive },
  { href: "/about",     label: "About",     Icon: Info },
];

export function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <CheckSquare className="h-5 w-5" />
            <span>Life Admin Companion</span>
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    location === href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="hidden md:flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="btn-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>

                {/* Hamburger — mobile only */}
                <button
                  className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5 text-foreground" />
                  ) : (
                    <Menu className="h-5 w-5 text-foreground" />
                  )}
                </button>
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

      {/* Mobile drawer */}
      {isAuthenticated && mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200">
            {/* Nav links */}
            <nav className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ href, label, Icon }) => (
                <Link key={href} href={href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location === href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </div>
                </Link>
              ))}
            </nav>

            {/* Divider + user row */}
            <div className="border-t border-border px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </div>
                <div className="leading-tight">
                  {user?.firstName && (
                    <p className="text-sm font-medium">{user.firstName} {user.lastName ?? ""}</p>
                  )}
                  {user?.email && (
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="btn-logout-mobile">
                <LogOut className="h-4 w-4 mr-1.5" />
                Log out
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
