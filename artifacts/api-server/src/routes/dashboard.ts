import { Router } from "express";
import { db, lifeAdminItemsTable } from "@workspace/db";
import { eq, and, lte, gte, isNull, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const activeItems = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(and(eq(lifeAdminItemsTable.userId, userId), sql`${lifeAdminItemsTable.status} != 'archived'`));

  const totalActive = activeItems.length;

  const overdueItems = activeItems.filter(
    (i) => i.dueDate && i.dueDate < today && i.status === "active"
  );
  const overdueCount = overdueItems.length;

  const dueSoonItems = activeItems.filter(
    (i) => i.dueDate && i.dueDate >= today && i.dueDate <= sevenDaysLater
  );
  const dueSoonCount = dueSoonItems.length;

  const dueThisMonthItems = activeItems.filter(
    (i) => i.dueDate && i.dueDate >= today && i.dueDate <= thirtyDaysLater
  );
  const dueThisMonthCount = dueThisMonthItems.length;

  const reminderPassedItems = activeItems.filter(
    (i) => i.reminderDate && i.reminderDate <= today
  );
  const reminderPassedCount = reminderPassedItems.length;

  const noDueDateItems = activeItems.filter((i) => !i.dueDate);
  const noDueDateCount = noDueDateItems.length;

  const categoryMap: Record<string, number> = {};
  for (const item of activeItems) {
    categoryMap[item.category] = (categoryMap[item.category] ?? 0) + 1;
  }
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

  const needsAttentionItems = [
    ...overdueItems,
    ...dueSoonItems,
    ...reminderPassedItems,
  ]
    .filter((item, idx, arr) => arr.findIndex((i) => i.id === item.id) === idx)
    .slice(0, 10)
    .map(mapItem);

  res.json({
    totalActive,
    overdueCount,
    dueSoonCount,
    dueThisMonthCount,
    reminderPassedCount,
    noDueDateCount,
    byCategory,
    needsAttention: needsAttentionItems,
  });
});

router.get("/dashboard/upcoming", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const items = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(
      and(
        eq(lifeAdminItemsTable.userId, userId),
        sql`${lifeAdminItemsTable.status} != 'archived'`,
        sql`${lifeAdminItemsTable.dueDate} >= ${today}`,
        sql`${lifeAdminItemsTable.dueDate} <= ${thirtyDaysLater}`
      )
    )
    .orderBy(sql`${lifeAdminItemsTable.dueDate} asc`);

  res.json({ items: items.map(mapItem) });
});

router.get("/dashboard/recent", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const items = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(and(eq(lifeAdminItemsTable.userId, userId), sql`${lifeAdminItemsTable.status} != 'archived'`))
    .orderBy(desc(lifeAdminItemsTable.updatedAt))
    .limit(10);

  res.json({ items: items.map(mapItem) });
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
