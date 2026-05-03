import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useListItems, getListItemsQueryKey } from "@workspace/api-client-react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { parseISO, isPast, isWithinInterval, addDays, startOfDay } from "date-fns";
import { formatCategory } from "@/lib/costs";

// ── helpers ───────────────────────────────────────────────────────────────────

type Status = "active" | "completed" | "renewed" | "cancelled" | "archived";

const STATUS_META: Record<Status, { label: string; Icon: React.ElementType; className: string }> = {
  active:    { label: "Active",    Icon: Clock,        className: "bg-blue-50 text-blue-700 border-blue-100" },
  completed: { label: "Completed", Icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  renewed:   { label: "Renewed",   Icon: RefreshCw,    className: "bg-violet-50 text-violet-700 border-violet-100" },
  cancelled: { label: "Cancelled", Icon: XCircle,      className: "bg-gray-100 text-gray-500 border-gray-200" },
  archived:  { label: "Archived",  Icon: Archive,      className: "bg-orange-50 text-orange-700 border-orange-100" },
};

function isUrgent(dueDate: string | null | undefined, renewalDate: string | null | undefined): boolean {
  const check = renewalDate ?? dueDate;
  if (!check) return false;
  try {
    const d = startOfDay(parseISO(check));
    const today = startOfDay(new Date());
    return isPast(d) || isWithinInterval(d, { start: today, end: addDays(today, 7) });
  } catch { return false; }
}

function matchesQuery(query: string, fields: (string | null | undefined)[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

// ── component ─────────────────────────────────────────────────────────────────

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const { data } = useListItems(
    {},
    { query: { queryKey: getListItemsQueryKey({}), staleTime: 30_000 } },
  );

  const allItems = data?.items ?? [];

  const filtered = allItems.filter((item) =>
    matchesQuery(query, [
      item.title as string,
      item.category as string,
      item.provider as string | null,
      item.referenceNumber as string | null,
      item.notes as string | null,
    ])
  );

  const active   = filtered.filter((i) => i.status === "active");
  const others   = filtered.filter((i) => i.status !== "active");

  const handleSelect = useCallback(
    (id: number) => {
      onOpenChange(false);
      setQuery("");
      navigate(`/items/${id}`);
    },
    [navigate, onOpenChange],
  );

  // Reset query when closed
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search items by name, category, provider…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No items found for "{query}"</p>
          </div>
        </CommandEmpty>

        {active.length > 0 && (
          <CommandGroup heading="Active items">
            {active.slice(0, 8).map((item) => {
              const urgent = isUrgent(
                item.dueDate as string | null,
                item.renewalDate as string | null,
              );
              const meta = STATUS_META["active"];
              return (
                <CommandItem
                  key={item.id as number}
                  value={`${item.title} ${item.category} ${item.provider ?? ""}`}
                  onSelect={() => handleSelect(item.id as number)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{item.title as string}</span>
                      {urgent && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatCategory(item.category as string)}
                      {item.provider ? ` · ${item.provider}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 font-medium ${meta.className}`}
                  >
                    {meta.label}
                  </Badge>
                </CommandItem>
              );
            })}
            {active.length > 8 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                +{active.length - 8} more — refine your search
              </p>
            )}
          </CommandGroup>
        )}

        {others.length > 0 && active.length > 0 && <CommandSeparator />}

        {others.length > 0 && (
          <CommandGroup heading="Other items">
            {others.slice(0, 5).map((item) => {
              const status = (item.status as Status) ?? "active";
              const meta = STATUS_META[status] ?? STATUS_META.active;
              const Icon = meta.Icon;
              return (
                <CommandItem
                  key={item.id as number}
                  value={`${item.title} ${item.category} ${item.provider ?? ""} ${status}`}
                  onSelect={() => handleSelect(item.id as number)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title as string}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatCategory(item.category as string)}
                      {item.provider ? ` · ${item.provider}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 font-medium ${meta.className}`}
                  >
                    {meta.label}
                  </Badge>
                </CommandItem>
              );
            })}
            {others.length > 5 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                +{others.length - 5} more — refine your search
              </p>
            )}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span><kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
        <span><kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd> open</span>
        <span><kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">esc</kbd> close</span>
      </div>
    </CommandDialog>
  );
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useCommandSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return { open, setOpen };
}
