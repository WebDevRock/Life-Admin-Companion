import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Bell } from "lucide-react";
import { useListItems, getListItemsQueryKey } from "@workspace/api-client-react";
import { parseISO, isToday, isPast, startOfDay } from "date-fns";

function isDue(reminderDate: string | null | undefined): boolean {
  if (!reminderDate) return false;
  try {
    const d = startOfDay(parseISO(reminderDate));
    return isPast(d) || isToday(d);
  } catch {
    return false;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useListItems(
    { status: "active" },
    { query: { queryKey: getListItemsQueryKey({ status: "active" }), staleTime: 60_000 } },
  );

  const dueItems = (data?.items ?? []).filter((item) =>
    isDue(item.reminderDate as string | null | undefined),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors"
        aria-label={`Notifications${dueItems.length > 0 ? ` (${dueItems.length})` : ""}`}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {dueItems.length > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center leading-none">
            {dueItems.length > 9 ? "9+" : dueItems.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Reminders</span>
            {dueItems.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {dueItems.length} item{dueItems.length !== 1 ? "s" : ""} due
              </span>
            )}
          </div>

          {dueItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reminders due today</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {dueItems.map((item) => (
                <Link
                  key={item.id as number}
                  href={`/items/${item.id}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium truncate">{item.title as string}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {item.category as string}
                      {item.provider ? ` · ${item.provider}` : ""}
                    </p>
                    {item.reminderDate && (
                      <p className="text-xs text-destructive mt-0.5">
                        Reminder: {item.reminderDate as string}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 py-2 border-t border-border">
            <Link href="/items" onClick={() => setOpen(false)}>
              <span className="text-xs text-primary hover:underline cursor-pointer">
                View all items →
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
