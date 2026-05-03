import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth/AuthDialog";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ItemsPage from "@/pages/items";
import ItemDetailPage from "@/pages/item-detail";
import ItemFormPage from "@/pages/item-form";
import ArchivedPage from "@/pages/archived";
import CostSummaryPage from "@/pages/cost-summary";
import MoneyCheckPage from "@/pages/money-check";
import AboutPage from "@/pages/about";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, params }: { component: React.ComponentType<any>; params?: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-sm">You need to be signed in to view this page.</p>
        <button
          onClick={() => setAuthOpen(true)}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-white"
          style={{ background: "#7c9e6e" }}
        >
          Sign in
        </button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return <Component params={params} />;
}

function Router() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/dashboard">
            {() => <ProtectedRoute component={Dashboard} />}
          </Route>
          <Route path="/items">
            {() => <ProtectedRoute component={ItemsPage} />}
          </Route>
          <Route path="/items/new">
            {() => <ProtectedRoute component={() => <ItemFormPage mode="create" />} />}
          </Route>
          <Route path="/items/:id/edit">
            {(params) => <ProtectedRoute component={() => <ItemFormPage mode="edit" params={params} />} />}
          </Route>
          <Route path="/items/:id">
            {(params) => <ProtectedRoute component={() => <ItemDetailPage params={params} />} />}
          </Route>
          <Route path="/archived">
            {() => <ProtectedRoute component={ArchivedPage} />}
          </Route>
          <Route path="/costs">
            {() => <ProtectedRoute component={CostSummaryPage} />}
          </Route>
          <Route path="/money-check">
            {() => <ProtectedRoute component={MoneyCheckPage} />}
          </Route>
          <Route path="/about" component={AboutPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
