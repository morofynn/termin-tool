globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../../chunks/audit-log_CTvpblnZ.mjs';
import { s as sendCustomerNotification, a as sendAdminNotification } from '../../../../chunks/email_BWfHmdDu.mjs';
import { g as getShortLabel, a as getLongLabel } from '../../../../chunks/event-config_Bu30ckYK.mjs';
export { renderers } from '../../../../renderers.mjs';

const DAY_NAMES = {
  friday: getShortLabel("friday"),
  saturday: getShortLabel("saturday"),
  sunday: getShortLabel("sunday")
};
const DAY_NAMES_FULL = {
  friday: getLongLabel("friday"),
  saturday: getLongLabel("saturday"),
  sunday: getLongLabel("sunday")
};
const POST = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "Termin-ID fehlt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error("KV namespace not available");
      return new Response(
        JSON.stringify({ message: "Datenspeicher nicht verfügbar" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointmentData = await kv.get(`appointment:${id}`);
    if (!appointmentData) {
      return new Response(
        JSON.stringify({ message: "Termin nicht gefunden" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointment = JSON.parse(appointmentData);
    if (appointment.googleEventId) {
      const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "1016862075130-uc8r6pv6pivrjr4a9ei88gp6puss9htg.apps.googleusercontent.com";
      const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "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";
      const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "1//04Ck84hmIis09CgYIARAAGAQSNwF-L9IrVeFqvKINk6q5UDZiNWKre6-6EK775cifbJvqLEoys19YAMGoGSCAZZhxOuCZv4gfpb4";
      if (googleClientId && googleClientSecret && googleRefreshToken) {
        try {
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: googleClientId,
              client_secret: googleClientSecret,
              refresh_token: googleRefreshToken,
              grant_type: "refresh_token"
            })
          });
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "fynn.klinkow@moro-gmbh.de";
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.googleEventId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
              }
            );
            console.log("Google Calendar event deleted:", appointment.googleEventId);
          }
        } catch (error) {
          console.error("Failed to delete Google Calendar event:", error);
        }
      }
    }
    const settingsData = await kv.get("settings");
    const settings = settingsData ? JSON.parse(settingsData) : {
      companyName: "Ihre Firma",
      companyAddress: "Musterstraße 1, 12345 Musterstadt",
      companyPhone: "+49 123 456789",
      companyEmail: "kontakt@example.com",
      adminEmail: "admin@example.com",
      maxAppointmentsPerSlot: 1,
      bookingMode: "manual",
      requireApproval: true
    };
    try {
      await sendCustomerNotification(
        appointment,
        settings,
        "cancelled",
        locals
      );
      await sendAdminNotification(
        appointment,
        settings,
        "cancelled",
        locals
      );
      console.log(`Cancellation emails sent to customer and admin`);
    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError);
    }
    try {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = appointmentDate.toISOString().split("T")[0];
      const slotKey = `slot:${appointment.day}:${appointment.time}:${dateKey}`;
      const existingSlotData = await kv.get(slotKey);
      if (existingSlotData) {
        const slotAppointments = JSON.parse(existingSlotData);
        const updatedSlotAppointments = slotAppointments.filter((aptId) => aptId !== id);
        if (updatedSlotAppointments.length > 0) {
          await kv.put(
            slotKey,
            JSON.stringify(updatedSlotAppointments),
            { expirationTtl: 60 * 60 * 24 * 30 }
          );
        } else {
          await kv.delete(slotKey);
        }
      }
      appointment.status = "cancelled";
      appointment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await kv.put(`appointment:${id}`, JSON.stringify(appointment));
      await createAuditLog(
        kv,
        "Termin storniert",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin storniert. Zeitslot wurde freigegeben. E-Mails wurden versendet.`,
        appointment.id,
        "Admin"
      );
      return new Response(
        JSON.stringify({
          message: "Termin wurde storniert",
          appointment: {
            name: appointment.name,
            email: appointment.email,
            day: DAY_NAMES_FULL[appointment.day],
            time: appointment.time
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("KV Store error during cancellation:", error);
      return new Response(
        JSON.stringify({
          message: "Fehler beim Stornieren des Termins",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Cancellation error:", error);
    return new Response(
      JSON.stringify({
        message: "Ein unerwarteter Fehler ist aufgetreten",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
