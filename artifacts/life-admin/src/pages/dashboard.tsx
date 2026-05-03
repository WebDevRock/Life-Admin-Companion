import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetUpcomingItems,
  useGetRecentlyUpdatedItems,
} from "@workspace/api-client-react";
import {
  getGetDashboardSummaryQueryKey,
  getGetUpcomingItemsQueryKey,
  getGetRecentlyUpdatedItemsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Shield,
  Plus,
  TriangleAlert,
  Clock,
  ClipboardList,
} from "lucide-react";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";
import { useAuth } from "@/lib/auth-context";

function getUrgency(dueDate: string | null) {
  if (!dueDate) return "none";
  const due = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isPast(due) && due < today) return "overdue";
  if (isWithinInterval(due, { start: today, end: addDays(today, 7) })) return "due-soon";
  return "normal";
}

function ItemRow({ item }: { item: any }) {
  const urgency = getUrgency(item.dueDate);
  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{item.title}</span>
            {urgency === "overdue" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <TriangleAlert className="h-3 w-3" aria-hidden />
                Overdue
              </span>
            )}
            {urgency === "due-soon" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" aria-hidden />
                Due soon
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.category}
            {item.dueDate && ` · Due ${format(parseISO(item.dueDate), "dd MMM yyyy")}`}
          </div>
        </div>
        <Badge variant="outline" className="text-xs capitalize shrink-0">{item.status}</Badge>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcomingItems({
    query: { queryKey: getGetUpcomingItemsQueryKey() },
  });

  const { data: recent, isLoading: recentLoading } = useGetRecentlyUpdatedItems({
    query: { queryKey: getGetRecentlyUpdatedItemsQueryKey() },
  });

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Hello, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">Here is what needs your attention.</p>
        </div>
        <Button asChild>
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={summaryLoading ? "animate-pulse" : summary?.overdueCount ? "bg-destructive/5 border-destructive/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className={`text-sm font-medium ${summary?.overdueCount ? "text-destructive" : ""}`}>Overdue</CardTitle>
            <AlertCircle className={`w-4 h-4 ${summary?.overdueCount ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary?.overdueCount ? "text-destructive" : "text-foreground"}`}>
              {summaryLoading ? "—" : summary?.overdueCount ?? 0}
            </div>
            {!summaryLoading && (summary?.overdueCount ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Nothing overdue</p>
            )}
          </CardContent>
        </Card>

        <Card className={summaryLoading ? "animate-pulse" : summary?.dueSoonCount ? "bg-amber-500/5 border-amber-500/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className={`text-sm font-medium ${summary?.dueSoonCount ? "text-amber-700" : ""}`}>Due this week</CardTitle>
            <CalendarClock className={`w-4 h-4 ${summary?.dueSoonCount ? "text-amber-700" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary?.dueSoonCount ? "text-amber-700" : "text-foreground"}`}>
              {summaryLoading ? "—" : summary?.dueSoonCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Due this month</CardTitle>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? "—" : summary?.dueThisMonthCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total active</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? "—" : summary?.totalActive ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : !summary?.needsAttention?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nothing needs attention right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {summary.needsAttention.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/items">View all items</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming in 30 days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Coming up in 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : !upcoming?.items?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">You have no upcoming deadlines.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcoming.items.slice(0, 6).map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently updated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Recently updated
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : !recent?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Add your first life admin item to get started.</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/items/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add item
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 divide-y md:divide-y-0 divide-border">
              {recent.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
        <Shield className="h-4 w-4 shrink-0" aria-hidden />
        <p>Your life admin records are private to your account. This app is designed to help you stay organised, not to sell your data.</p>
      </div>
    </div>
  );
}
