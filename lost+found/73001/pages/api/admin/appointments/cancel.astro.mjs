globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../../chunks/audit-log_CTvpblnZ.mjs';
import { s as sendCustomerNotification, a as sendAdminNotification } from '../../../../chunks/email_NN1nw7lN.mjs';
import { g as getLongLabel } from '../../../../chunks/event-config_Dh5-uOwb.mjs';
import { D as DAY_NAMES } from '../../../../chunks/constants_CW49BNGH.mjs';
export { renderers } from '../../../../renderers.mjs';

const DAY_NAMES_FULL = {
  friday: getLongLabel("friday"),
  saturday: getLongLabel("saturday"),
  sunday: getLongLabel("sunday")
};
const POST = async ({ request, locals, url }) => {
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
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
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
      const baseUrl = url.origin;
      const appointmentUrl = `${baseUrl}/termin/${id}`;
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
      let customerEmailSent = false;
      let adminEmailSent = false;
      try {
        customerEmailSent = await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        if (customerEmailSent) {
          console.log(`✅ Customer cancellation notification sent to ${appointment.email}`);
        } else {
          console.error(`❌ Failed to send customer cancellation notification to ${appointment.email}`);
        }
      } catch (emailError) {
        console.error("Error sending customer cancellation notification:", emailError);
      }
      try {
        if (settings.emailNotifications && settings.adminEmail) {
          adminEmailSent = await sendAdminNotification(
            emailData,
            settings.adminEmail,
            locals?.runtime?.env
          );
          if (adminEmailSent) {
            console.log(`✅ Admin cancellation notification sent to ${settings.adminEmail}`);
          } else {
            console.error(`❌ Failed to send admin cancellation notification to ${settings.adminEmail}`);
          }
        }
      } catch (emailError) {
        console.error("Error sending admin cancellation notification:", emailError);
      }
      const emailStatus = customerEmailSent && adminEmailSent ? "E-Mails wurden versendet" : customerEmailSent ? "Nur Kunden-E-Mail versendet" : adminEmailSent ? "Nur Admin-E-Mail versendet" : "E-Mail-Versand fehlgeschlagen";
      await createAuditLog(
        kv,
        "Termin storniert (Admin)",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin storniert. Zeitslot wurde freigegeben. ${emailStatus}.`,
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
