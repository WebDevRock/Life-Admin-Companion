import { Router } from "express";
import { db, lifeAdminItemsTable } from "@workspace/db";
import { eq, and, or, ilike, asc, desc } from "drizzle-orm";
import { CreateItemBody, UpdateItemBody, ListItemsQueryParams, GetItemParams, UpdateItemParams, DeleteItemParams } from "@workspace/api-zod";
import { sql } from "drizzle-orm";
import { addWeeks, addMonths, addQuarters, addYears, format } from "date-fns";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapItem(item: typeof lifeAdminItemsTable.$inferSelect) {
  return {
    id: item.id,
    userId: item.userId,
    title: item.title,
    category: item.category,
    provider: item.provider ?? null,
    referenceNumber: item.referenceNumber ?? null,
    status: item.status,
    dueDate: item.dueDate ?? null,
    renewalDate: item.renewalDate ?? null,
    reminderDate: item.reminderDate ?? null,
    costAmount: item.costAmount != null ? Number(item.costAmount) : null,
    costFrequency: item.costFrequency,
    notes: item.notes ?? null,
    usefulLink: item.usefulLink ?? null,
    priority: item.priority,
    isRecurring: item.isRecurring,
    recurrenceFrequency: item.recurrenceFrequency ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Advance a date string by the given recurrence frequency.
 * Returns the new date as a YYYY-MM-DD string, or null if the input is null.
 */
function advanceDate(
  dateStr: string | null,
  freq: "weekly" | "monthly" | "quarterly" | "annually"
): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  let next: Date;
  switch (freq) {
    case "weekly":    next = addWeeks(d, 1);    break;
    case "monthly":   next = addMonths(d, 1);   break;
    case "quarterly": next = addQuarters(d, 1); break;
    case "annually":  next = addYears(d, 1);    break;
  }
  return format(next, "yyyy-MM-dd");
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/items", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const parseResult = ListItemsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { category, status, dueSoon, search, includeArchived } = parseResult.data;

  const conditions = [eq(lifeAdminItemsTable.userId, userId)];

  if (!includeArchived) {
    conditions.push(sql`${lifeAdminItemsTable.status} != 'archived'`);
  }
  if (category) {
    conditions.push(eq(lifeAdminItemsTable.category, category));
  }
  if (status) {
    conditions.push(sql`${lifeAdminItemsTable.status} = ${status}`);
  }
  if (dueSoon) {
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    conditions.push(sql`${lifeAdminItemsTable.dueDate} >= ${today} AND ${lifeAdminItemsTable.dueDate} <= ${sevenDaysLater}`);
  }
  if (search) {
    conditions.push(
      or(
        ilike(lifeAdminItemsTable.title, `%${search}%`),
        ilike(lifeAdminItemsTable.provider, `%${search}%`),
        ilike(lifeAdminItemsTable.notes, `%${search}%`),
      )!
    );
  }

  const items = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(and(...conditions))
    .orderBy(asc(lifeAdminItemsTable.dueDate), desc(lifeAdminItemsTable.updatedAt));

  res.json({ items: items.map(mapItem) });
});

router.post("/items", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const parseResult = CreateItemBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation error", details: parseResult.error.issues });
    return;
  }

  const data = parseResult.data;
  const insertValues = {
    userId,
    title: data.title,
    category: data.category,
    provider: data.provider ?? null,
    referenceNumber: data.referenceNumber ?? null,
    status: data.status ?? "active",
    dueDate: data.dueDate ?? null,
    renewalDate: data.renewalDate ?? null,
    reminderDate: data.reminderDate ?? null,
    costAmount: data.costAmount != null ? String(data.costAmount) : null,
    costFrequency: data.costFrequency ?? "unknown",
    notes: data.notes ?? null,
    usefulLink: data.usefulLink ?? null,
    priority: data.priority ?? "normal",
    isRecurring: data.isRecurring ?? false,
    recurrenceFrequency: data.recurrenceFrequency ?? null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [item] = await db
    .insert(lifeAdminItemsTable)
    .values(insertValues as any)
    .returning();

  res.status(201).json(mapItem(item));
});

router.get("/items/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const parseResult = GetItemParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [item] = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(and(eq(lifeAdminItemsTable.id, parseResult.data.id), eq(lifeAdminItemsTable.userId, userId)));

  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(mapItem(item));
});

router.put("/items/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const paramsResult = UpdateItemParams.safeParse({ id: Number(req.params.id) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyResult = UpdateItemBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Validation error", details: bodyResult.error.issues });
    return;
  }

  const data = bodyResult.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined)              updateData.title = data.title;
  if (data.category !== undefined)           updateData.category = data.category;
  if (data.provider !== undefined)           updateData.provider = data.provider;
  if (data.referenceNumber !== undefined)    updateData.referenceNumber = data.referenceNumber;
  if (data.status !== undefined)             updateData.status = data.status;
  if (data.dueDate !== undefined)            updateData.dueDate = data.dueDate;
  if (data.renewalDate !== undefined)        updateData.renewalDate = data.renewalDate;
  if (data.reminderDate !== undefined)       updateData.reminderDate = data.reminderDate;
  if (data.costAmount !== undefined)         updateData.costAmount = data.costAmount != null ? String(data.costAmount) : null;
  if (data.costFrequency !== undefined)      updateData.costFrequency = data.costFrequency;
  if (data.notes !== undefined)              updateData.notes = data.notes;
  if (data.usefulLink !== undefined)         updateData.usefulLink = data.usefulLink;
  if (data.priority !== undefined)           updateData.priority = data.priority;
  if (data.isRecurring !== undefined)        updateData.isRecurring = data.isRecurring;
  if (data.recurrenceFrequency !== undefined) updateData.recurrenceFrequency = data.recurrenceFrequency;

  const [updatedItem] = await db
    .update(lifeAdminItemsTable)
    .set(updateData)
    .where(and(eq(lifeAdminItemsTable.id, paramsResult.data.id), eq(lifeAdminItemsTable.userId, userId)))
    .returning();

  if (!updatedItem) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // ── Recurring logic ──────────────────────────────────────────────────────
  // If the item is recurring and has just been set to "renewed",
  // automatically create the next instance with dates advanced by the interval.
  if (
    data.status === "renewed" &&
    updatedItem.isRecurring &&
    updatedItem.recurrenceFrequency
  ) {
    const freq = updatedItem.recurrenceFrequency;
    const nextDueDate = advanceDate(updatedItem.dueDate, freq);
    const nextRenewalDate = advanceDate(updatedItem.renewalDate, freq);
    const nextReminderDate = advanceDate(updatedItem.reminderDate, freq);

    await db.insert(lifeAdminItemsTable).values({
      userId,
      title: updatedItem.title,
      category: updatedItem.category,
      provider: updatedItem.provider,
      referenceNumber: updatedItem.referenceNumber,
      status: "active",
      dueDate: nextDueDate,
      renewalDate: nextRenewalDate,
      reminderDate: nextReminderDate,
      costAmount: updatedItem.costAmount,
      costFrequency: updatedItem.costFrequency,
      notes: updatedItem.notes,
      usefulLink: updatedItem.usefulLink,
      priority: updatedItem.priority,
      isRecurring: true,
      recurrenceFrequency: updatedItem.recurrenceFrequency,
    });
  }

  res.json(mapItem(updatedItem));
});

router.delete("/items/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const parseResult = DeleteItemParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [item] = await db
    .delete(lifeAdminItemsTable)
    .where(and(eq(lifeAdminItemsTable.id, parseResult.data.id), eq(lifeAdminItemsTable.userId, userId)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
