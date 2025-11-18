globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../chunks/audit-log_CTvpblnZ.mjs';
import { a as sendAdminNotification, s as sendCustomerNotification } from '../../../chunks/email_CLsyDTz6.mjs';
import { a as getLongLabel } from '../../../chunks/event-config_C66uWX7F.mjs';
export { renderers } from '../../../renderers.mjs';

const DAY_NAMES = {
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag"
};
const DAY_NAMES_FULL = {
  friday: getLongLabel("friday"),
  saturday: getLongLabel("saturday"),
  sunday: getLongLabel("sunday")
};
const SETTINGS_KEY = "app:settings";
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
const POST = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const { appointmentId } = body;
    if (!appointmentId) {
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
    const appointmentData = await kv.get(`appointment:${appointmentId}`);
    if (!appointmentData) {
      return new Response(
        JSON.stringify({ message: "Termin nicht gefunden" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointment = JSON.parse(appointmentData);
    if (appointment.status === "cancelled") {
      return new Response(
        JSON.stringify({ message: "Termin wurde bereits storniert" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    let emailNotifications = false;
    let adminEmail = "";
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        emailNotifications = settings.emailNotifications || false;
        adminEmail = settings.adminEmail || "";
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    if (appointment.googleEventId) {
      const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
      const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
      const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
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
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || 'fynnnn"';
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
    try {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = appointmentDate.toISOString().split("T")[0];
      const slotKey = `slot:${appointment.day}:${appointment.time}:${dateKey}`;
      const existingSlotData = await kv.get(slotKey);
      if (existingSlotData) {
        const slotAppointments = JSON.parse(existingSlotData);
        const updatedSlotAppointments = slotAppointments.filter((aptId) => aptId !== appointmentId);
        if (updatedSlotAppointments.length > 0) {
          await kv.put(
            slotKey,
            JSON.stringify(updatedSlotAppointments),
            { expirationTtl: 60 * 60 * 24 * 90 }
          );
        } else {
          await kv.delete(slotKey);
        }
      }
      appointment.status = "cancelled";
      await kv.put(`appointment:${appointmentId}`, JSON.stringify(appointment));
      await createAuditLog(
        kv,
        "Termin storniert (Kunde)",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Kunden storniert. Zeitslot wurde freigegeben.`,
        appointment.id,
        appointment.email
      );
      const baseUrl = url.origin;
      const appointmentUrl = `${baseUrl}/termin/${appointmentId}`;
      const emailData = {
        name: appointment.name,
        company: appointment.company,
        phone: appointment.phone,
        email: appointment.email,
        day: DAY_NAMES_FULL[appointment.day],
        time: appointment.time,
        message: appointment.message,
        appointmentUrl,
        status: "cancelled",
        action: "cancelled"
      };
      if (emailNotifications && adminEmail && isValidEmail(adminEmail)) {
        try {
          const adminEmailSent = await sendAdminNotification(
            emailData,
            adminEmail,
            locals?.runtime?.env
          );
          if (adminEmailSent) {
            console.log(`✅ Admin cancellation notification sent to ${adminEmail}`);
            await createAuditLog(
              kv,
              "E-Mail an Admin",
              `Admin wurde über Stornierung informiert (${adminEmail}).`,
              appointment.id,
              "system"
            );
          }
        } catch (emailError) {
          console.error("Error sending admin notification:", emailError);
        }
      }
      try {
        const customerEmailSent = await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        if (customerEmailSent) {
          console.log(`✅ Customer cancellation notification sent to ${appointment.email}`);
          await createAuditLog(
            kv,
            "E-Mail an Kunde",
            `Stornierungsbestätigung wurde an ${appointment.email} gesendet.`,
            appointment.id,
            "system"
          );
        }
      } catch (emailError) {
        console.error("Error sending customer notification:", emailError);
      }
      return new Response(
        JSON.stringify({
          message: "Termin wurde erfolgreich storniert",
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
