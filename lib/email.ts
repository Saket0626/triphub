/**
 * Confirmation email via Resend.
 *
 * TODO: Put your Resend API key in .env.local as RESEND_API_KEY
 * and set EMAIL_FROM to a verified domain sender.
 * Docs: https://resend.com/docs/send-with-nodejs
 */

import { Resend } from "resend";
import { env, isResendConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

export async function sendConfirmationEmail(booking: Booking, to: string) {
  const html = renderItineraryEmail(booking);

  if (!isResendConfigured()) {
    console.info("[TripHub] Resend not configured — skipping live send. Preview:\n", html.slice(0, 400));
    return { skipped: true as const, id: "sandbox-local" };
  }

  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: env.sandboxMode
      ? `[Sandbox] Your TripHub confirmation ${booking.confirmationNumber}`
      : `Your TripHub confirmation ${booking.confirmationNumber}`,
    html,
  });
  if (error) throw new Error(error.message);
  return { skipped: false as const, id: data?.id ?? "sent" };
}

function renderItineraryEmail(booking: Booking) {
  const snap = booking.itinerarySnapshot;
  const flight = snap.flight;
  const hotel = snap.hotel;
  const sandboxNote = booking.sandbox
    ? `<p style="background:#f4efe6;padding:12px 16px;border-radius:8px;color:#5c4a32;font-size:14px;">This is a <strong>sandbox / test booking</strong>. Nothing was charged and no real tickets were issued.</p>`
    : "";

  return `<!doctype html>
<html>
<body style="font-family:Georgia,serif;background:#f7f4ef;color:#1c1917;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;">
    <p style="letter-spacing:0.2em;text-transform:uppercase;font-size:11px;color:#0f766e;">TripHub</p>
    <h1 style="font-weight:500;font-size:28px;">You're all set</h1>
    <p>Confirmation <strong>${booking.confirmationNumber}</strong></p>
    ${sandboxNote}
    <hr style="border:none;border-top:1px solid #e7e0d6;margin:24px 0;" />
    <p><strong>Travelers</strong><br/>${snap.travelers.map((t) => t.fullName).join(", ")}</p>
    ${
      flight
        ? `<p><strong>Flight</strong><br/>${flight.airline} ${flight.flightNumber}<br/>${flight.from} → ${flight.to}<br/>${formatDate(snap.trip.departureDate)}${snap.trip.returnDate ? ` – ${formatDate(snap.trip.returnDate)}` : ""}<br/>${formatCurrency(flight.totalPrice)}</p>`
        : ""
    }
    ${
      hotel
        ? `<p><strong>Hotel</strong><br/>${hotel.name}<br/>${hotel.neighborhood}, ${hotel.city}<br/>${formatCurrency(hotel.totalPrice)}</p>`
        : ""
    }
    ${
      snap.ground
        ? `<p><strong>Ground</strong><br/>${snap.ground.title} · ${formatCurrency(snap.ground.priceEstimate)}</p>`
        : "<p><strong>Ground</strong><br/>No ground transport added</p>"
    }
    ${
      snap.activities.length
        ? `<p><strong>Activities</strong><br/>${snap.activities.map((a) => `${a.name} · ${formatCurrency(a.totalPrice)}`).join("<br/>")}</p>`
        : "<p><strong>Activities</strong><br/>None added</p>"
    }
    <p style="font-size:20px;margin-top:24px;">Total ${formatCurrency(snap.totalPrice)}</p>
  </div>
</body>
</html>`;
}
