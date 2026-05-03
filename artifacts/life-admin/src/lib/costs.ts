export type CostFreq = "one-off" | "weekly" | "monthly" | "quarterly" | "annually" | "unknown";

export function toMonthly(amount: number, freq: CostFreq): number | null {
  switch (freq) {
    case "weekly":     return (amount * 52) / 12;
    case "monthly":    return amount;
    case "quarterly":  return amount / 3;
    case "annually":   return amount / 12;
    default:           return null;
  }
}

export function toAnnual(amount: number, freq: CostFreq): number | null {
  switch (freq) {
    case "weekly":     return amount * 52;
    case "monthly":    return amount * 12;
    case "quarterly":  return amount * 4;
    case "annually":   return amount;
    default:           return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCategory(cat: string): string {
  return cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const FREQ_ORDER: CostFreq[] = [
  "monthly",
  "annually",
  "quarterly",
  "weekly",
  "one-off",
  "unknown",
];

export const FREQ_LABEL: Record<CostFreq, string> = {
  monthly:    "Monthly",
  annually:   "Annual",
  quarterly:  "Quarterly",
  weekly:     "Weekly",
  "one-off":  "One-off",
  unknown:    "Unknown frequency",
};
