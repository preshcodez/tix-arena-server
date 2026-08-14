import { sendEmail } from "./sendEmail";

export const sendRejectionEmail = async (
  email: string,
  name: string,
  type: "vendor" | "event",
  rejectionReason: string,
  eventTitle?: string,
): Promise<void> => {
  const subject =
    type === "vendor"
      ? "Your Tix-Arena Vendor Application Was Rejected"
      : "Your Tix-Arena Event Was Rejected";

  const htmlContent =
    type === "vendor"
      ? `
        <div>
          <h2>Vendor Application Rejected</h2>

          <p>Hello ${name},</p>

          <p>
            Unfortunately, your vendor application on Tix-Arena
            was not approved.
          </p>

          <p>
            <strong>Reason:</strong>
            ${rejectionReason}
          </p>

          <p>
            Please review the reason above and make the necessary
            corrections before applying again.
          </p>

          <p>
            Thank you for your understanding.
          </p>
        </div>
      `
      : `
        <div>
          <h2>Event Rejected</h2>

          <p>Hello ${name},</p>

          <p>
            Unfortunately, your event
            <strong>${eventTitle}</strong>
            was not approved by the Tix-Arena admin.
          </p>

          <p>
            <strong>Reason:</strong>
            ${rejectionReason}
          </p>

          <p>
            Please review the feedback and make the necessary
            corrections.
          </p>

          <p>
            Thank you for your understanding.
          </p>
        </div>
      `;

  await sendEmail(email, subject, htmlContent);
};
