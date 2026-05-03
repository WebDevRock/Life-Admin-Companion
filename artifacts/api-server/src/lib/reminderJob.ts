import cron from "node-cron";
import { db, lifeAdminItemsTable, usersTable, reminderEmailLogTable } from "@workspace/db";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { sendReminderEmail, isEmailConfigured } from "./emailService";
import { logger } from "./logger";
import { format } from "date-fns";

export async function runReminderCheck(): Promise<void> {
  if (!isEmailConfigured()) {
    logger.debug("Reminder job: email not configured, skipping");
    return;
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  logger.info({ date: todayStr }, "Reminder job: running check");

  const alreadySent = await db
    .select({ userId: reminderEmailLogTable.userId, itemId: reminderEmailLogTable.itemId })
    .from(reminderEmailLogTable)
    .where(eq(reminderEmailLogTable.reminderDate, todayStr));

  const sentKeys = new Set(alreadySent.map((r) => `${r.userId}:${r.itemId}`));

  const items = await db
    .select()
    .from(lifeAdminItemsTable)
    .where(
      and(
        eq(lifeAdminItemsTable.status, "active"),
        isNotNull(lifeAdminItemsTable.reminderDate),
        lte(lifeAdminItemsTable.reminderDate, todayStr),
      ),
    );

  const byUser: Record<string, (typeof items)[number][]> = {};
  for (const item of items) {
    if (sentKeys.has(`${item.userId}:${item.id}`)) continue;
    if (!byUser[item.userId]) byUser[item.userId] = [];
    byUser[item.userId].push(item);
  }

  const userIds = Object.keys(byUser);
  if (userIds.length === 0) {
    logger.info("Reminder job: no new reminders to send");
    return;
  }

  for (const userId of userIds) {
    const userItems = byUser[userId];
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user?.email) {
      logger.warn({ userId }, "Reminder job: no email for user, skipping");
      continue;
    }

    const emailItems = userItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      provider: item.provider,
      dueDate: item.dueDate,
      renewalDate: item.renewalDate,
      priority: item.priority,
    }));

    try {
      await sendReminderEmail(user.email, user.firstName, emailItems);
      for (const item of userItems) {
        await db.insert(reminderEmailLogTable).values({
          userId,
          itemId: item.id,
          reminderDate: todayStr,
        });
      }
      logger.info({ userId, count: userItems.length }, "Reminder job: sent and logged");
    } catch (err) {
      logger.error({ err, userId }, "Reminder job: failed to send email");
    }
  }
}

export function startReminderJob(): void {
  if (!isEmailConfigured()) {
    logger.info("Reminder job: SMTP not configured — skipping scheduler. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL to enable email reminders.");
    return;
  }

  cron.schedule("0 8 * * *", () => {
    runReminderCheck().catch((err) =>
      logger.error({ err }, "Reminder job: uncaught error"),
    );
  }, { timezone: "UTC" });

  logger.info("Reminder job: scheduled daily at 08:00 UTC");
}
