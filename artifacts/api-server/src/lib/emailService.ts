import nodemailer from "nodemailer";
import { logger } from "./logger";
import { format, parseISO } from "date-fns";

function getTransport() {
  const host = process.env["SMTP_HOST"];
  const port = Number(process.env["SMTP_PORT"] ?? "587");
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatDate(str: string | null): string {
  if (!str) return "—";
  try { return format(parseISO(str), "d MMM yyyy"); } catch { return str; }
}

export function isEmailConfigured(): boolean {
  return !!(
    process.env["SMTP_HOST"] &&
    process.env["SMTP_USER"] &&
    process.env["SMTP_PASS"] &&
    process.env["FROM_EMAIL"]
  );
}

interface ReminderItem {
  id: number;
  title: string;
  category: string;
  provider: string | null;
  dueDate: string | null;
  renewalDate: string | null;
  priority: string;
}

export async function sendReminderEmail(
  toEmail: string,
  firstName: string | null,
  items: ReminderItem[],
): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    logger.warn("Email transport not configured — skipping send");
    return;
  }

  const from = process.env["FROM_EMAIL"] ?? process.env["SMTP_USER"];
  const name = firstName ?? "there";

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#1f2937;">${item.title}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;text-transform:capitalize;">${item.category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${item.provider ?? "—"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${formatDate(item.dueDate)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${formatDate(item.renewalDate)}</td>
      </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#7c6a52;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Life Admin Companion</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your reminder for today</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 20px;color:#374151;font-size:16px;">Hi ${name},</p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">
        You have <strong>${items.length} item${items.length !== 1 ? "s" : ""}</strong> needing attention today:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb;">Item</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb;">Category</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb;">Provider</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb;">Due</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb;">Renewal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="margin-top:32px;">
        <a href="${process.env["APP_URL"] ?? "https://your-app.replit.app"}/items"
           style="display:inline-block;background:#7c6a52;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          View your items →
        </a>
      </div>
      <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;">
        You're receiving this because a reminder was set for today. To stop receiving emails, remove the reminder date from your items in Life Admin Companion.
      </p>
    </div>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: `"Life Admin Companion" <${from}>`,
    to: toEmail,
    subject: `Reminder: ${items.length} item${items.length !== 1 ? "s" : ""} need${items.length === 1 ? "s" : ""} your attention`,
    html,
  });

  logger.info({ to: toEmail, count: items.length }, "Reminder email sent");
}
