import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itemStatusEnum = pgEnum("item_status", [
  "active",
  "completed",
  "renewed",
  "cancelled",
  "archived",
]);

export const costFrequencyEnum = pgEnum("cost_frequency", [
  "one-off",
  "weekly",
  "monthly",
  "quarterly",
  "annually",
  "unknown",
]);

export const priorityEnum = pgEnum("priority_level", [
  "low",
  "normal",
  "high",
]);

export const lifeAdminItemsTable = pgTable("life_admin_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  provider: text("provider"),
  referenceNumber: text("reference_number"),
  status: itemStatusEnum("status").notNull().default("active"),
  dueDate: date("due_date"),
  renewalDate: date("renewal_date"),
  reminderDate: date("reminder_date"),
  costAmount: numeric("cost_amount", { precision: 10, scale: 2 }),
  costFrequency: costFrequencyEnum("cost_frequency").notNull().default("unknown"),
  notes: text("notes"),
  usefulLink: text("useful_link"),
  priority: priorityEnum("priority").notNull().default("normal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLifeAdminItemSchema = createInsertSchema(lifeAdminItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectLifeAdminItemSchema = createSelectSchema(lifeAdminItemsTable);

export type InsertLifeAdminItem = z.infer<typeof insertLifeAdminItemSchema>;
export type LifeAdminItem = typeof lifeAdminItemsTable.$inferSelect;
