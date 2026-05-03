import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateItem, useUpdateItem, useGetItem } from "@workspace/api-client-react";
import {
  getListItemsQueryKey,
  getGetItemQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
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

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  provider: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "renewed", "cancelled", "archived"]),
  dueDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  costAmount: z.coerce.number().optional().nullable(),
  costFrequency: z.enum(["one-off", "weekly", "monthly", "quarterly", "annually", "unknown"]),
  notes: z.string().optional().nullable(),
  usefulLink: z.string().optional().nullable(),
  priority: z.enum(["low", "normal", "high"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ItemFormPage({
  params,
  mode,
}: {
  params?: { id: string };
  mode: "create" | "edit";
}) {
  const id = params?.id ? Number(params.id) : undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingItem, isLoading: loadingItem } = useGetItem(id!, {
    query: {
      enabled: mode === "edit" && !!id,
      queryKey: getGetItemQueryKey(id!),
    },
  });

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "Bills",
      provider: "",
      referenceNumber: "",
      status: "active",
      dueDate: "",
      renewalDate: "",
      reminderDate: "",
      costAmount: null,
      costFrequency: "unknown",
      notes: "",
      usefulLink: "",
      priority: "normal",
    },
  });

  useEffect(() => {
    if (existingItem && mode === "edit") {
      form.reset({
        title: existingItem.title,
        category: existingItem.category,
        provider: existingItem.provider ?? "",
        referenceNumber: existingItem.referenceNumber ?? "",
        status: existingItem.status as any,
        dueDate: existingItem.dueDate ?? "",
        renewalDate: existingItem.renewalDate ?? "",
        reminderDate: existingItem.reminderDate ?? "",
        costAmount: existingItem.costAmount ?? null,
        costFrequency: existingItem.costFrequency as any,
        notes: existingItem.notes ?? "",
        usefulLink: existingItem.usefulLink ?? "",
        priority: existingItem.priority as any,
      });
    }
  }, [existingItem, mode, form]);

  function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      category: values.category,
      provider: values.provider || null,
      referenceNumber: values.referenceNumber || null,
      status: values.status,
      dueDate: values.dueDate || null,
      renewalDate: values.renewalDate || null,
      reminderDate: values.reminderDate || null,
      costAmount: values.costAmount ?? null,
      costFrequency: values.costFrequency,
      notes: values.notes || null,
      usefulLink: values.usefulLink || null,
      priority: values.priority,
    };

    if (mode === "create") {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (newItem) => {
            queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            toast({ title: "Item added successfully" });
            setLocation(`/items/${newItem.id}`);
          },
          onError: () => {
            toast({ title: "Failed to save item", variant: "destructive" });
          },
        }
      );
    } else if (mode === "edit" && id) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({}) });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            toast({ title: "Item updated" });
            setLocation(`/items/${id}`);
          },
          onError: () => {
            toast({ title: "Failed to update item", variant: "destructive" });
          },
        }
      );
    }
  }

  if (mode === "edit" && loadingItem) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={mode === "edit" && id ? `/items/${id}` : "/items"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-serif font-bold">
          {mode === "create" ? "Add a new item" : "Edit item"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {mode === "create"
            ? "Fill in what you know — you can always update it later."
            : "Update the details below."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic information</h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive" aria-label="required">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Home insurance renewal" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive" aria-label="required">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-form-category">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Priority <span className="text-destructive" aria-label="required">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider or organisation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Aviva, BT, NHS" {...field} value={field.value ?? ""} data-testid="input-provider" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference or account number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} value={field.value ?? ""} data-testid="input-reference" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive" aria-label="required">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="renewed">Renewed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} data-testid="input-due-date" />
                    </FormControl>
                    <FormDescription className="text-xs">When does this need to be done?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} data-testid="input-renewal-date" />
                    </FormControl>
                    <FormDescription className="text-xs">When does it renew?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reminderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} data-testid="input-reminder-date" />
                    </FormControl>
                    <FormDescription className="text-xs">When should you be reminded?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Cost</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                        data-testid="input-cost-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Frequency <span className="text-destructive" aria-label="required">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one-off">One-off</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Notes and links</h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any useful information, login details, or reminders..."
                      className="min-h-24"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usefulLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Useful link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-useful-link"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Link to the provider's website or your online account</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" asChild>
              <Link href={mode === "edit" && id ? `/items/${id}` : "/items"}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending} data-testid="btn-submit-form">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "create" ? "Add item" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
