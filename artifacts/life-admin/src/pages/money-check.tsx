import { useMemo } from "react";
import { Link } from "wouter";
import { useListItems, getListItemsQueryKey } from "@workspace/api-client-react";
import { parseISO, addDays, isWithinInterval, startOfDay, isPast, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarRange,
  AlertTriangle,
  CircleCheck,
  Plus,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  type CostFreq,
  toMonthly,
  toAnnual,
  formatCurrency,
  formatCategory,
  FREQ_ORDER,
  FREQ_LABEL,
} from "@/lib/costs";

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  try { return parseISO(str); } catch { return null; }
}

function daysUntil(date: Date): number {
  const today = startOfDay(new Date());
  return Math.ceil((startOfDay(date).getTime() - today.getTime()) / 86_400_000);
}

function isWithin30Days(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = startOfDay(new Date());
  const end   = addDays(today, 30);
  return isWithinInterval(startOfDay(d), { start: today, end }) || isPast(d) || isToday(d);
}

function formatDateShort(str: string | null | undefined): string {
  if (!str) return "—";
  const d = parseDate(str);
  if (!d) return str;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function reviewLabel(renewalDate: string | null | undefined, dueDate: string | null | undefined): string | null {
  const checkDate = renewalDate ?? dueDate;
  if (!checkDate) return null;
  const d = parseDate(checkDate);
  if (!d) return null;
  const days = daysUntil(d);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days}d`;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface CostItem {
  id: number;
  title: string;
  category: string;
  provider: string | null;
  costAmount: number;
  costFreq: CostFreq;
  renewalDate: string | null;
  dueDate: string | null;
  needsReview: boolean;
  monthly: number | null;
  annual: number | null;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function MoneyCheckPage() {
  const { data, isLoading } = useListItems(
    { status: "active" },
    { query: { queryKey: getListItemsQueryKey({ status: "active" }) } },
  );

  const { costItems, noCostItems, byFreq, totalMonthly, totalAnnual, reviewItems } =
    useMemo(() => {
      const items = data?.items ?? [];
      const costItems: CostItem[] = [];
      const noCostItems: { id: number; title: string; category: string }[] = [];

      for (const raw of items) {
        if (raw.costAmount == null) {
          noCostItems.push({ id: raw.id as number, title: raw.title as string, category: raw.category as string });
          continue;
        }
        const freq = (raw.costFrequency ?? "unknown") as CostFreq;
        const amount = raw.costAmount as number;
        const renewalDate = (raw.renewalDate as string | null) ?? null;
        const dueDate     = (raw.dueDate     as string | null) ?? null;
        costItems.push({
          id:          raw.id as number,
          title:       raw.title as string,
          category:    raw.category as string,
          provider:    (raw.provider as string | null) ?? null,
          costAmount:  amount,
          costFreq:    freq,
          renewalDate,
          dueDate,
          needsReview: isWithin30Days(renewalDate) || isWithin30Days(dueDate),
          monthly:     toMonthly(amount, freq),
          annual:      toAnnual(amount, freq),
        });
      }

      const reviewItems = costItems
        .filter((i) => i.needsReview)
        .sort((a, b) => {
          const dateA = parseDate(a.renewalDate ?? a.dueDate);
          const dateB = parseDate(b.renewalDate ?? b.dueDate);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        });

      let totalMonthly = 0;
      let totalAnnual  = 0;
      const byFreq: Partial<Record<CostFreq, CostItem[]>> = {};

      for (const item of costItems) {
        if (item.monthly != null) totalMonthly += item.monthly;
        if (item.annual  != null) totalAnnual  += item.annual;
        if (!byFreq[item.costFreq]) byFreq[item.costFreq] = [];
        byFreq[item.costFreq]!.push(item);
      }

      for (const grp of Object.values(byFreq)) {
        grp!.sort((a, b) => (b.annual ?? b.costAmount) - (a.annual ?? a.costAmount));
      }

      return { costItems, noCostItems, byFreq, totalMonthly, totalAnnual, reviewItems };
    }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-24 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  const hasData = costItems.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Money Check</h1>
          <p className="text-muted-foreground mt-1">Review your recurring costs and upcoming renewals</p>
        </div>
        <Button asChild size="sm">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Link>
        </Button>
      </div>

      {!hasData ? (
        <Card className="text-center py-16">
          <CardContent>
            <CircleCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No costs to review yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Add your bills, subscriptions, and contracts to get started.</p>
            <Button asChild>
              <Link href="/items/new"><Plus className="h-4 w-4 mr-2" />Add your first item</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Est. monthly
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="text-3xl font-bold text-primary font-serif">{formatCurrency(totalMonthly)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{costItems.filter(i => i.monthly != null).length} recurring items</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5" /> Est. annual
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="text-3xl font-bold text-primary font-serif">{formatCurrency(totalAnnual)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{costItems.length} items total</p>
              </CardContent>
            </Card>
          </div>

          {/* Due for review in next 30 days */}
          {reviewItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-sm">Due for review in the next 30 days</h2>
                <Badge variant="secondary" className="text-xs">{reviewItems.length}</Badge>
              </div>
              <div className="space-y-2">
                {reviewItems.map((item) => {
                  const label = reviewLabel(item.renewalDate, item.dueDate);
                  const checkDate = item.renewalDate ?? item.dueDate;
                  const d = parseDate(checkDate);
                  const days = d ? daysUntil(d) : null;
                  const isUrgent = days != null && days <= 7;
                  return (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${isUrgent ? "border-destructive/30 bg-destructive/5" : "border-amber-200 bg-amber-50/60"}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{item.title}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isUrgent ? "bg-destructive/15 text-destructive" : "bg-amber-100 text-amber-700"}`}>
                              {label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCategory(item.category)}
                            {item.provider ? ` · ${item.provider}` : ""}
                            {checkDate ? ` · ${item.renewalDate ? "Renewal" : "Due"}: ${formatDateShort(checkDate)}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(item.costAmount)}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.costFreq === "one-off" ? "one-off" : `per ${item.costFreq.replace("annually", "year").replace("monthly", "month").replace("quarterly", "quarter").replace("weekly", "week")}`}</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frequency groups */}
          {FREQ_ORDER.filter((freq) => byFreq[freq]?.length).map((freq) => {
            const items = byFreq[freq]!;
            const groupMonthly = items.reduce((s, i) => s + (i.monthly ?? 0), 0);
            const groupAnnual  = items.reduce((s, i) => s + (i.annual  ?? 0), 0);
            const hasRecurring = freq !== "one-off" && freq !== "unknown";

            return (
              <div key={freq}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm">{FREQ_LABEL[freq]}</h2>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  {hasRecurring && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatCurrency(groupMonthly)}<span className="text-muted-foreground/60">/mo</span></span>
                      <span className="font-medium text-foreground">{formatCurrency(groupAnnual)}<span className="font-normal text-muted-foreground">/yr</span></span>
                    </div>
                  )}
                </div>

                <Card className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {items.map((item) => {
                      const label = reviewLabel(item.renewalDate, item.dueDate);
                      const needsReview = item.needsReview;
                      const checkDate = item.renewalDate ?? item.dueDate;
                      const d = parseDate(checkDate);
                      const days = d ? daysUntil(d) : null;
                      const isUrgent = needsReview && days != null && days <= 7;

                      return (
                        <Link key={item.id} href={`/items/${item.id}`}>
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate">{item.title}</span>
                                {needsReview && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${isUrgent ? "bg-destructive/15 text-destructive" : "bg-amber-100 text-amber-700"}`}>
                                    {label}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">{formatCategory(item.category)}{item.provider ? ` · ${item.provider}` : ""}</span>
                                {(item.renewalDate || item.dueDate) && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.renewalDate ? `Renews ${formatDateShort(item.renewalDate)}` : `Due ${formatDateShort(item.dueDate)}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.costAmount)}</p>
                              {item.annual != null && freq !== "annually" && freq !== "one-off" && freq !== "unknown" && (
                                <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.annual)}/yr</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })}

          {/* Items without cost */}
          {noCostItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm text-muted-foreground">No cost recorded</h2>
                <Badge variant="outline" className="text-xs">{noCostItems.length}</Badge>
              </div>
              <Card className="border-dashed">
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-3">These active items are missing a cost amount — add one to include them in your totals.</p>
                  <div className="flex flex-wrap gap-2">
                    {noCostItems.map((item) => (
                      <Link key={item.id} href={`/items/${item.id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors text-xs">
                          {item.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
