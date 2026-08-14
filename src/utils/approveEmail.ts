import { sendEmail } from "./sendEmail";

export const sendApprovalEmail = async (
  email: string,
  name: string,
  type: "vendor" | "event",
  eventTitle?: string,
): Promise<void> => {
  const subject =
    type === "vendor"
      ? "Your Tix-Arena Vendor Account Has Been Approved"
      : "Your Tix-Arena Event Has Been Approved";

  const htmlContent =
    type === "vendor"
      ? `
        <div>
          <h2>Vendor Account Approved 🎉</h2>

          <p>Hello ${name},</p>

          <p>
            Congratulations! Your vendor account on Tix-Arena
            has been approved by the admin.
          </p>

          <p>
            You can now create and manage your events on the platform.
          </p>

          <p>
            Thank you for choosing Tix-Arena.
          </p>
        </div>
      `
      : `
        <div>
          <h2>Event Approved 🎉</h2>

          <p>Hello ${name},</p>

          <p>
            Your event
            <strong>${eventTitle}</strong>
            has been approved by the Tix-Arena admin.
          </p>

          <p>
            Your event can now be displayed to users and made available
            for ticket booking.
          </p>

          <p>
            Thank you for using Tix-Arena.
          </p>
        </div>
      `;

  await sendEmail(email, subject, htmlContent);
};
