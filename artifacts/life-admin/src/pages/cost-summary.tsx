import { useMemo } from "react";
import { Link } from "wouter";
import { useListItems, getListItemsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Calendar,
  CalendarRange,
  Plus,
  Info,
  RefreshCw,
} from "lucide-react";

type CostFrequency = "one-off" | "weekly" | "monthly" | "quarterly" | "annually" | "unknown";

function toMonthly(amount: number, frequency: CostFrequency): number | null {
  switch (frequency) {
    case "weekly":     return (amount * 52) / 12;
    case "monthly":    return amount;
    case "quarterly":  return amount / 3;
    case "annually":   return amount / 12;
    default:           return null;
  }
}

function toAnnual(amount: number, frequency: CostFrequency): number | null {
  switch (frequency) {
    case "weekly":     return amount * 52;
    case "monthly":    return amount * 12;
    case "quarterly":  return amount * 4;
    case "annually":   return amount;
    default:           return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCategory(cat: string): string {
  return cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function frequencyLabel(freq: CostFrequency): string {
  switch (freq) {
    case "one-off":    return "One-off";
    case "weekly":     return "Weekly";
    case "monthly":    return "Monthly";
    case "quarterly":  return "Quarterly";
    case "annually":   return "Annually";
    default:           return "Unknown";
  }
}

const FREQ_BADGE: Record<CostFrequency, string> = {
  "one-off":   "bg-slate-100 text-slate-700",
  "weekly":    "bg-blue-50 text-blue-700",
  "monthly":   "bg-violet-50 text-violet-700",
  "quarterly": "bg-amber-50 text-amber-700",
  "annually":  "bg-emerald-50 text-emerald-700",
  "unknown":   "bg-gray-100 text-gray-500",
};

interface CategoryRow {
  category: string;
  monthly: number;
  annual: number;
  count: number;
}

interface ItemRow {
  id: number;
  title: string;
  category: string;
  costAmount: number;
  costFrequency: CostFrequency;
  provider: string | null;
}

export default function CostSummaryPage() {
  const { data, isLoading } = useListItems(
    { status: "active" },
    { query: { queryKey: getListItemsQueryKey({ status: "active" }) } }
  );

  const items = data?.items ?? [];

  const { recurring, oneOff, unknown, totalMonthly, totalAnnual, byCategory } =
    useMemo(() => {
      const recurring: ItemRow[] = [];
      const oneOff: ItemRow[] = [];
      const unknown: ItemRow[] = [];
      let totalMonthly = 0;
      let totalAnnual = 0;
      const catMap: Record<string, CategoryRow> = {};

      for (const item of items) {
        if (item.costAmount == null) continue;
        const amount = item.costAmount as number;
        const freq = (item.costFrequency ?? "unknown") as CostFrequency;
        const row: ItemRow = {
          id: item.id as number,
          title: item.title as string,
          category: item.category as string,
          costAmount: amount,
          costFrequency: freq,
          provider: item.provider ?? null,
        };

        if (freq === "unknown") {
          unknown.push(row);
        } else if (freq === "one-off") {
          oneOff.push(row);
        } else {
          recurring.push(row);
          const m = toMonthly(amount, freq)!;
          const a = toAnnual(amount, freq)!;
          totalMonthly += m;
          totalAnnual += a;
          if (!catMap[row.category]) {
            catMap[row.category] = { category: row.category, monthly: 0, annual: 0, count: 0 };
          }
          catMap[row.category].monthly += m;
          catMap[row.category].annual += a;
          catMap[row.category].count += 1;
        }
      }

      const byCategory = Object.values(catMap).sort((a, b) => b.annual - a.annual);
      return { recurring, oneOff, unknown, totalMonthly, totalAnnual, byCategory };
    }, [items]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Cost Summary</h1>
          <p className="text-muted-foreground mt-1">Your active recurring commitments at a glance</p>
        </div>
        <Button asChild size="sm">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No active items yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Add your bills and subscriptions to see a spend summary.</p>
            <Button asChild>
              <Link href="/items/new">
                <Plus className="h-4 w-4 mr-2" />
                Add your first item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary font-serif">{formatCurrency(totalMonthly)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {recurring.length} recurring item{recurring.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  Annual total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary font-serif">{formatCurrency(totalAnnual)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  across {byCategory.length} categor{byCategory.length !== 1 ? "ies" : "y"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">By category</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {byCategory.map((row) => {
                    const pct = totalAnnual > 0 ? (row.annual / totalAnnual) * 100 : 0;
                    return (
                      <div key={row.category} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{formatCategory(row.category)}</span>
                            <span className="text-xs text-muted-foreground">{row.count} item{row.count !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-sm">{formatCurrency(row.annual)}<span className="text-muted-foreground font-normal">/yr</span></span>
                            <span className="text-muted-foreground text-xs ml-3">{formatCurrency(row.monthly)}/mo</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary rounded-full h-1.5 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item-level breakdown */}
          {recurring.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">All recurring items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recurring
                    .slice()
                    .sort((a, b) => {
                      const aA = toAnnual(a.costAmount, a.costFrequency) ?? 0;
                      const bA = toAnnual(b.costAmount, b.costFrequency) ?? 0;
                      return bA - aA;
                    })
                    .map((item) => (
                      <Link key={item.id} href={`/items/${item.id}`}>
                        <div className="px-6 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatCategory(item.category)}
                              {item.provider ? ` · ${item.provider}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_BADGE[item.costFrequency]}`}>
                              {frequencyLabel(item.costFrequency)}
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(item.costAmount)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* One-off costs */}
          {oneOff.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">One-off costs</CardTitle>
                  <Badge variant="secondary" className="text-xs">not included in totals</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {oneOff.map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <div className="px-6 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{formatCategory(item.category)}</p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums ml-4">{formatCurrency(item.costAmount)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items with unknown cost */}
          {unknown.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {unknown.length} item{unknown.length !== 1 ? "s" : ""} with no cost set
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">These active items don't have a cost amount recorded. Add costs to include them in your totals.</p>
                <div className="flex flex-wrap gap-2">
                  {unknown.map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors text-xs">
                        {item.title}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recurring items note */}
          {recurring.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-4">
              <RefreshCw className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>Totals include all active items with a recurring cost frequency. Weekly costs are annualised at 52 weeks. One-off costs and items with unknown frequency are excluded from totals.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
