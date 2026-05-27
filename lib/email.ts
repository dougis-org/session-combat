import { MailtrapClient } from "mailtrap";

function getClient(): MailtrapClient {
  const token = process.env.MAILTRAP_TOKEN;
  if (!token) {
    throw new Error(
      "MAILTRAP_TOKEN environment variable is not set. Email sending is unavailable."
    );
  }
  return new MailtrapClient({ token });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const client = getClient();
  const fromEmail = process.env.MAILTRAP_FROM_EMAIL || "noreply@session-combat.app";

  await client.send({
    from: { email: fromEmail, name: "Session Combat" },
    to: [{ email: to }],
    subject: "Reset your Session Combat password",
    html: `<p>You requested a password reset.</p>
<p><a href="${resetUrl}">Click here to reset your password</a></p>
<p>This link expires in 15 minutes. If you did not request a reset, ignore this email.</p>`,
    text: `You requested a password reset.\n\nReset your password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request a reset, ignore this email.`,
  });
}
