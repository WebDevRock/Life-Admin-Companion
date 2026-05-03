import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useFirebaseAuth } from "@/lib/firebase-auth";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  LogIn,
  LogOut,
  CheckSquare,
  Menu,
  X,
  LayoutDashboard,
  List,
  Wallet,
  Archive,
  Info,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { CommandSearch, useCommandSearch } from "./CommandSearch";

const NAV_LINKS = [
  { href: "/dashboard",    label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/items",        label: "Items",        Icon: List },
  { href: "/money-check",  label: "Money Check",  Icon: Wallet },
  { href: "/archived",     label: "Archived",     Icon: Archive },
  { href: "/about",        label: "About",        Icon: Info },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useFirebaseAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandSearch();

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
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-primary shrink-0">
            <CheckSquare className="h-5 w-5" />
            <span className="hidden sm:inline">Life Admin Companion</span>
            <span className="sm:hidden">Life Admin</span>
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
          <div className="flex items-center gap-1.5">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 h-9 rounded-md px-2.5 border border-border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
                  aria-label="Search items"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline text-sm">Search…</span>
                  <span className="hidden lg:inline text-xs bg-background border border-border rounded px-1 py-0.5 font-mono leading-none">
                    ⌘K
                  </span>
                </button>

                <NotificationBell />

                <div className="hidden md:flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="btn-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>

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
              <Button onClick={() => setAuthOpen(true)} data-testid="btn-login">
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
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200">

            <div className="px-4 pt-3 pb-2">
              <button
                onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Search className="h-4 w-4 shrink-0" />
                Search items…
              </button>
            </div>

            <nav className="px-4 py-2 space-y-0.5">
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

      {/* Auth dialog */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Global command palette */}
      {isAuthenticated && (
        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </>
  );
}
