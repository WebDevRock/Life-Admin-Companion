import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const reminderEmailLogTable = pgTable("reminder_email_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: integer("item_id").notNull(),
  reminderDate: date("reminder_date").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
