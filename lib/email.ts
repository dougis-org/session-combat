import { MailtrapClient } from "mailtrap";

let client: MailtrapClient | null = null;

function getClient(): MailtrapClient {
  if (client) return client;
  const token = process.env.MAILTRAP_TOKEN;
  if (!token) {
    throw new Error(
      "MAILTRAP_TOKEN environment variable is not set. Email sending is unavailable."
    );
  }
  client = new MailtrapClient({ token });
  return client;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Accept only an absolute https URL or a site-relative path; anything else
 * (other schemes, protocol-relative `//host` or `/\host`, backslashes,
 * garbage) collapses to '#'.
 */
function safeLinkHref(url: string): string {
  if (url.includes("\\")) return "#";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : "#";
  } catch {
    return "#";
  }
}

function resolveFromEmail(): string {
  if (!process.env.MAILTRAP_FROM_EMAIL) {
    console.warn(
      "MAILTRAP_FROM_EMAIL is not set — falling back to noreply@session-combat.app. Set this in production to avoid unverified-sender failures."
    );
  }
  return process.env.MAILTRAP_FROM_EMAIL || "noreply@session-combat.app";
}

export interface FeedbackEmailInput {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export async function sendFeedbackEmail({
  to,
  replyTo,
  subject,
  text,
}: FeedbackEmailInput): Promise<void> {
  const client = getClient();
  await client.send({
    from: { email: resolveFromEmail(), name: "Session Combat" },
    to: [{ email: to }],
    reply_to: { email: replyTo },
    category: "feedback",
    subject,
    text,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const client = getClient();
  const fromEmail = resolveFromEmail();
  const safeHref = safeLinkHref(resetUrl);
  const safeUrl = escapeHtml(safeHref);

  await client.send({
    from: { email: fromEmail, name: "Session Combat" },
    to: [{ email: to }],
    category: "password-reset",
    subject: "Reset your Session Combat password",
    html: `<p>You requested a password reset.</p>
<p><a href="${safeUrl}">Click here to reset your password</a></p>
<p>This link expires in 15 minutes. If you did not request a reset, ignore this email.</p>`,
    text: `You requested a password reset.\n\nReset your password: ${safeHref}\n\nThis link expires in 15 minutes. If you did not request a reset, ignore this email.`,
  });
}
