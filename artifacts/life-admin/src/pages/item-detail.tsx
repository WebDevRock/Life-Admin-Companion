import { Link, useLocation } from "wouter";
import { useGetItem, useDeleteItem, useUpdateItem } from "@workspace/api-client-react";
import { getGetItemQueryKey, getListItemsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pencil, Archive, Trash2, ArrowLeft, ExternalLink, TriangleAlert, Clock } from "lucide-react";
import { format, isPast, isWithinInterval, addDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function getUrgency(dueDate: string | null) {
  if (!dueDate) return "none";
  const due = parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isPast(due) && due < today) return "overdue";
  if (isWithinInterval(due, { start: today, end: addDays(today, 7) })) return "due-soon";
  return "normal";
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useGetItem(id, {
    query: { enabled: !!id, queryKey: getGetItemQueryKey(id) },
  });

  const archiveMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  function handleArchive() {
    archiveMutation.mutate(
      { id, data: { status: "archived" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Item archived" });
          setLocation("/items");
        },
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Item deleted" });
          setLocation("/items");
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">Item not found</h2>
        <Button asChild className="mt-4">
          <Link href="/items">Back to items</Link>
        </Button>
      </div>
    );
  }

  const urgency = getUrgency(item.dueDate ?? null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/items">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to items
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-serif font-bold text-foreground">{item.title}</h1>
            {urgency === "overdue" && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                <TriangleAlert className="h-4 w-4" aria-hidden />
                Overdue
              </span>
            )}
            {urgency === "due-soon" && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4" aria-hidden />
                Due soon
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{item.category}</Badge>
            <Badge variant="secondary" className="capitalize">{item.status}</Badge>
            <Badge variant={item.priority === "high" ? "default" : "outline"} className="capitalize">
              {item.priority} priority
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" data-testid="btn-edit-item">
            <Link href={`/items/${item.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive} data-testid="btn-archive-item">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" data-testid="btn-delete-item">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{item.title}". Consider archiving it instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {item.provider && (
              <div><span className="font-medium text-muted-foreground">Provider:</span> <span className="ml-2">{item.provider}</span></div>
            )}
            {item.referenceNumber && (
              <div><span className="font-medium text-muted-foreground">Reference:</span> <span className="ml-2 font-mono">{item.referenceNumber}</span></div>
            )}
            {item.costAmount != null && (
              <div><span className="font-medium text-muted-foreground">Cost:</span> <span className="ml-2">£{item.costAmount.toFixed(2)} ({item.costFrequency})</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dates</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {item.dueDate && (
              <div><span className="font-medium text-muted-foreground">Due date:</span> <span className="ml-2">{format(parseISO(item.dueDate), "dd MMMM yyyy")}</span></div>
            )}
            {item.renewalDate && (
              <div><span className="font-medium text-muted-foreground">Renewal date:</span> <span className="ml-2">{format(parseISO(item.renewalDate), "dd MMMM yyyy")}</span></div>
            )}
            {item.reminderDate && (
              <div><span className="font-medium text-muted-foreground">Reminder:</span> <span className="ml-2">{format(parseISO(item.reminderDate), "dd MMMM yyyy")}</span></div>
            )}
            {!item.dueDate && !item.renewalDate && !item.reminderDate && (
              <div className="text-muted-foreground">No dates set.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {(item.notes || item.usefulLink) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes and links</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {item.notes && <p className="text-foreground whitespace-pre-wrap">{item.notes}</p>}
            {item.usefulLink && (
              <a
                href={item.usefulLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:no-underline"
                data-testid="link-useful-link"
              >
                <ExternalLink className="h-3 w-3" />
                {item.usefulLink}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        Created {format(new Date(item.createdAt), "dd MMM yyyy")} · Updated {format(new Date(item.updatedAt), "dd MMM yyyy 'at' HH:mm")}
      </div>
    </div>
  );
}
