import { Link } from "wouter";
import { useListItems, useUpdateItem, useDeleteItem } from "@workspace/api-client-react";
import { getListItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { RotateCcw, Trash2, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ArchivedPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = { includeArchived: true, status: "archived" };
  const { data, isLoading } = useListItems(params, {
    query: { queryKey: getListItemsQueryKey(params) },
  });

  const restoreMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const items = data?.items ?? [];

  function handleRestore(id: number) {
    restoreMutation.mutate(
      { id, data: { status: "active" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(params) });
          toast({ title: "Item restored to active" });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(params) });
          toast({ title: "Item permanently deleted" });
        },
      }
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Archived items</h1>
        <p className="text-muted-foreground mt-1">
          Items you have archived. You can restore them or delete them permanently.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <h2 className="text-xl font-semibold text-muted-foreground">No archived items.</h2>
          <p className="text-muted-foreground text-sm">
            When you archive items they will appear here.
          </p>
          <Button asChild variant="outline">
            <Link href="/items">View active items</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} data-testid={`card-archived-${item.id}`} className="opacity-80">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.provider && <span className="mr-4">{item.provider}</span>}
                    {item.dueDate && <span>Due {format(parseISO(item.dueDate), "dd MMM yyyy")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" asChild aria-label="View item">
                    <Link href={`/items/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Restore item"
                    onClick={() => handleRestore(item.id)}
                    data-testid={`btn-restore-${item.id}`}
                  >
                    <RotateCcw className="h-4 w-4 text-primary" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Delete permanently" data-testid={`btn-delete-${item.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{item.title}" and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
