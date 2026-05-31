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

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const client = getClient();
  if (!process.env.MAILTRAP_FROM_EMAIL) {
    console.warn(
      "MAILTRAP_FROM_EMAIL is not set — falling back to noreply@session-combat.app. Set this in production to avoid unverified-sender failures."
    );
  }
  const fromEmail = process.env.MAILTRAP_FROM_EMAIL || "noreply@session-combat.app";

  await client.send({
    from: { email: fromEmail, name: "Session Combat" },
    to: [{ email: to }],
    category: "password-reset",
    subject: "Reset your Session Combat password",
    html: `<p>You requested a password reset.</p>
<p><a href="${resetUrl}">Click here to reset your password</a></p>
<p>This link expires in 15 minutes. If you did not request a reset, ignore this email.</p>`,
    text: `You requested a password reset.\n\nReset your password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request a reset, ignore this email.`,
  });
}
