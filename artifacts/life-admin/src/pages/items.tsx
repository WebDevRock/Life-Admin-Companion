import { useState } from "react";
import { Link } from "wouter";
import { useListItems, useCreateItem } from "@workspace/api-client-react";
import { getListItemsQueryKey } from "@workspace/api-client-react";
import { useDeleteItem, useUpdateItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  AlertCircle,
  Clock,
  Archive,
  Trash2,
  Pencil,
  Eye,
  TriangleAlert,
  RefreshCw,
  Copy,
} from "lucide-react";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "All",
  "Bills",
  "Insurance",
  "Vehicle",
  "Home",
  "Health",
  "Family",
  "Pets",
  "Subscriptions",
  "Documents",
  "Warranties",
  "Other",
];

const STATUSES = ["All", "active", "completed", "renewed", "cancelled"];

function getItemStatus(dueDate: string | null) {
  if (!dueDate) return "none";
  const due = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isPast(due) && due < today) return "overdue";
  if (isWithinInterval(due, { start: today, end: addDays(today, 7) })) return "due-soon";
  return "normal";
}

export default function ItemsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [dueSoon, setDueSoon] = useState(false);

  const params = {
    ...(search ? { search } : {}),
    ...(category !== "All" ? { category } : {}),
    ...(status !== "All" ? { status } : {}),
    ...(dueSoon ? { dueSoon: true } : {}),
  };

  const { data, isLoading } = useListItems(params, {
    query: { queryKey: getListItemsQueryKey(params) },
  });

  const archiveMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();
  const duplicateMutation = useCreateItem();

  const items = data?.items ?? [];

  function handleArchive(id: number) {
    archiveMutation.mutate(
      { id, data: { status: "archived" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          toast({ title: "Item archived" });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          toast({ title: "Item deleted" });
        },
      }
    );
  }

  function handleDuplicate(item: (typeof items)[number]) {
    duplicateMutation.mutate(
      {
        data: {
          title: `Copy of ${item.title}`,
          category: item.category as Parameters<typeof duplicateMutation.mutate>[0]["data"]["category"],
          status: "active",
          priority: (item.priority ?? "medium") as Parameters<typeof duplicateMutation.mutate>[0]["data"]["priority"],
          provider: item.provider ?? undefined,
          referenceNumber: item.referenceNumber ?? undefined,
          dueDate: item.dueDate ?? undefined,
          renewalDate: item.renewalDate ?? undefined,
          reminderDate: item.reminderDate ?? undefined,
          costAmount: item.costAmount ?? undefined,
          costFrequency: (item.costFrequency ?? undefined) as Parameters<typeof duplicateMutation.mutate>[0]["data"]["costFrequency"],
          notes: item.notes ?? undefined,
          usefulLink: item.usefulLink ?? undefined,
          isRecurring: item.isRecurring ?? false,
          recurrenceFrequency: (item.recurrenceFrequency ?? undefined) as Parameters<typeof duplicateMutation.mutate>[0]["data"]["recurrenceFrequency"],
        },
      },
      {
        onSuccess: (created) => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          toast({ title: "Item duplicated", description: `"${created.title}" created.` });
        },
        onError: () => {
          toast({ title: "Failed to duplicate", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Your items</h1>
          <p className="text-muted-foreground mt-1">All your active life admin in one place.</p>
        </div>
        <Button asChild data-testid="btn-add-item">
          <Link href="/items/new">
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "All" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={dueSoon ? "default" : "outline"}
          onClick={() => setDueSoon((v) => !v)}
          data-testid="btn-due-soon-filter"
        >
          <Clock className="h-4 w-4 mr-2" />
          Due soon
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">📋</div>
          <h2 className="text-xl font-semibold">
            {search || category !== "All" || status !== "All" || dueSoon
              ? "No items match your filters."
              : "Add your first life admin item."}
          </h2>
          <p className="text-muted-foreground">
            Keep track of bills, renewals, documents, and deadlines all in one place.
          </p>
          <Button asChild>
            <Link href="/items/new">
              <Plus className="h-4 w-4 mr-2" />
              Add item
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const urgency = getItemStatus(item.dueDate ?? null);
            return (
              <Card
                key={item.id}
                data-testid={`card-item-${item.id}`}
                className={`transition-shadow hover:shadow-md ${
                  urgency === "overdue"
                    ? "border-l-4 border-l-destructive"
                    : urgency === "due-soon"
                    ? "border-l-4 border-l-amber-500"
                    : ""
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                      {urgency === "overdue" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full" aria-label="Overdue">
                          <TriangleAlert className="h-3 w-3" aria-hidden />
                          Overdue
                        </span>
                      )}
                      {urgency === "due-soon" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full" aria-label="Due soon">
                          <Clock className="h-3 w-3" aria-hidden />
                          Due soon
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{item.status}</Badge>
                      {item.priority === "high" && (
                        <Badge className="text-xs">High priority</Badge>
                      )}
                      {item.isRecurring && item.recurrenceFrequency && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <RefreshCw className="h-3 w-3" aria-hidden />
                          {item.recurrenceFrequency}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {item.provider && <span>{item.provider}</span>}
                      {item.dueDate && (
                        <span>Due {format(parseISO(item.dueDate), "dd MMM yyyy")}</span>
                      )}
                      {item.costAmount != null && (
                        <span>£{item.costAmount.toFixed(2)} / {item.costFrequency}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" asChild aria-label="View item">
                      <Link href={`/items/${item.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label="Edit item">
                      <Link href={`/items/${item.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Duplicate item"
                      onClick={() => handleDuplicate(item)}
                      disabled={duplicateMutation.isPending}
                      data-testid={`btn-duplicate-${item.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Archive item"
                      onClick={() => handleArchive(item.id)}
                      data-testid={`btn-archive-${item.id}`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Delete item" data-testid={`btn-delete-${item.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{item.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this item. Consider archiving it instead if you might need it later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
