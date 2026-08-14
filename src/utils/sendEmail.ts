import { BrevoClient } from "@getbrevo/brevo";

export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BREVO_API_KEY is not configured");
    }

    console.log(`[dev] Email to ${to}: ${subject}`);
    return;
  }

  const brevo = new BrevoClient({ apiKey });

  await brevo.transactionalEmails.sendTransacEmail({
    subject,
    htmlContent,
    sender: {
      name: process.env.BREVO_SENDER_NAME ?? "Tix Arena",
      email: process.env.BREVO_SENDER_EMAIL ?? "",
    },
    to: [{ email: to }],
  });
};
