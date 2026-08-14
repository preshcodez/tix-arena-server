import { sendEmail } from "../utils/sendEmail";

interface PurchaseTicketEmailData {
  email: string;
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
  ticketCode: string;
  qrCode?: string;
}

export const emailPurchaseTicket = async ({
  email,
  fullName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketType,
  quantity,
  totalAmount,
  ticketCode,
  qrCode,
}: PurchaseTicketEmailData) => {
  const subject = `Ticket Confirmation - ${eventTitle}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Ticket Confirmation</title>
      </head>

      <body
        style="
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 30px;
        "
      >

        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
          "
        >

          <h2>Ticket Confirmed 🎟️</h2>

          <p>
            Hello ${fullName || "there"},
          </p>

          <p>
            Your payment was successful and your ticket for
            <strong>${eventTitle}</strong> has been confirmed.
          </p>

          <hr />

          <h3>Event Details</h3>

          <p>
            <strong>Event:</strong>
            ${eventTitle}
          </p>

          <p>
            <strong>Date:</strong>
            ${eventDate}
          </p>

          <p>
            <strong>Location:</strong>
            ${eventLocation}
          </p>

          <hr />

          <h3>Ticket Details</h3>

          <p>
            <strong>Ticket Type:</strong>
            ${ticketType}
          </p>

          <p>
            <strong>Quantity:</strong>
            ${quantity}
          </p>

          <p>
            <strong>Total Amount:</strong>
            ₦${totalAmount}
          </p>

          <p>
            <strong>Ticket Code:</strong>
            <span
              style="
                font-family: monospace;
                background-color: #f1f1f1;
                padding: 5px;
              "
            >
              ${ticketCode}
            </span>
          </p>

          ${
            qrCode
              ? `
                <div
                  style="
                    text-align: center;
                    margin-top: 25px;
                  "
                >
                  <h3>Your QR Code</h3>

                  <img
                    src="${qrCode}"
                    alt="Ticket QR Code"
                    style="
                      width: 200px;
                      height: 200px;
                    "
                  />
                </div>
              `
              : ""
          }

          <p>
            Please keep your ticket code and QR code available
            when you arrive at the event.
          </p>

          <p>
            Thank you for using Tix-Arena.
          </p>

          <p>
            Regards,<br />
            <strong>Tix-Arena Team</strong>
          </p>

        </div>

      </body>
    </html>
  `;

  await sendEmail(email, subject, htmlContent);
};
