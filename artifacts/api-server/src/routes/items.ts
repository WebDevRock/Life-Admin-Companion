import { Router } from "express";
import { db, lifeAdminItemsTable } from "@workspace/db";
import { eq, and, or, ilike, lte, gte, isNull, desc, asc } from "drizzle-orm";
import { CreateItemBody, UpdateItemBody, ListItemsQueryParams, GetItemParams, UpdateItemParams, DeleteItemParams } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

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

  const mapped = items.map(mapItem);
  res.json({ items: mapped });
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
  const [item] = await db
    .insert(lifeAdminItemsTable)
    .values({
      userId,
      title: data.title,
      category: data.category,
      provider: data.provider ?? null,
      referenceNumber: data.referenceNumber ?? null,
      status: (data.status as any) ?? "active",
      dueDate: data.dueDate ?? null,
      renewalDate: data.renewalDate ?? null,
      reminderDate: data.reminderDate ?? null,
      costAmount: data.costAmount != null ? String(data.costAmount) : null,
      costFrequency: (data.costFrequency as any) ?? "unknown",
      notes: data.notes ?? null,
      usefulLink: data.usefulLink ?? null,
      priority: (data.priority as any) ?? "normal",
    })
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
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.referenceNumber !== undefined) updateData.referenceNumber = data.referenceNumber;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate;
  if (data.reminderDate !== undefined) updateData.reminderDate = data.reminderDate;
  if (data.costAmount !== undefined) updateData.costAmount = data.costAmount != null ? String(data.costAmount) : null;
  if (data.costFrequency !== undefined) updateData.costFrequency = data.costFrequency;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.usefulLink !== undefined) updateData.usefulLink = data.usefulLink;
  if (data.priority !== undefined) updateData.priority = data.priority;

  const [item] = await db
    .update(lifeAdminItemsTable)
    .set(updateData)
    .where(and(eq(lifeAdminItemsTable.id, paramsResult.data.id), eq(lifeAdminItemsTable.userId, userId)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(mapItem(item));
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
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export default router;
