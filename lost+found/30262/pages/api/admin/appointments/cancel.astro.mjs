globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../../chunks/audit-log_BDxUJbGF.mjs';
import { g as getAppointmentUrl, s as sendCustomerNotification, a as sendAdminNotification } from '../../../../chunks/url-utils_Do_VNoAn.mjs';
import { g as getLongLabel } from '../../../../chunks/event-config_hIr2Xf8F.mjs';
import { g as getAppointment, a as getSettings, u as updateAppointment, D as DAY_NAMES } from '../../../../chunks/kv-utils_Cp3fsz2v.mjs';
import { r as releaseSlot } from '../../../../chunks/slot-utils_CyY0Z7gC.mjs';
import { v as validateAndParseBerlinDate } from '../../../../chunks/date-utils_D4nZ-TEO.mjs';
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
    const appointment = await getAppointment(kv, id);
    if (!appointment) {
      return new Response(
        JSON.stringify({ message: "Termin nicht gefunden" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (!appointmentDate) {
      console.error(`Invalid appointmentDate for appointment ${id}: ${appointment.appointmentDate}`);
      return new Response(
        JSON.stringify({ message: "Ungültiges Termin-Datum" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (appointment.googleEventId && appointment.status !== "cancelled") {
      const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || undefined                                ;
      const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || undefined                                    ;
      const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || undefined                                    ;
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
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || undefined                                   || "primary";
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.googleEventId}?sendUpdates=none`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
              }
            );
            console.log("✅ Google Calendar event deleted:", appointment.googleEventId);
          }
        } catch (error) {
          console.error("Failed to delete Google Calendar event:", error);
        }
      }
    } else if (appointment.status === "cancelled") {
      console.log("⏭️ Skipping Google Calendar deletion - appointment already cancelled");
    }
    const settings = await getSettings(kv);
    try {
      const released = await releaseSlot(
        kv,
        appointment.day,
        appointment.time,
        appointment.appointmentDate,
        id
      );
      if (released) {
        console.log(`✅ Slot released for ${appointment.day} ${appointment.time}`);
      } else {
        console.warn(`⚠️ Slot not found or already released for ${appointment.day} ${appointment.time}`);
      }
      appointment.status = "cancelled";
      appointment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await updateAppointment(kv, appointment);
      const appointmentUrl = getAppointmentUrl(id, locals?.runtime?.env, url.origin);
      const emailData = {
        name: appointment.name,
        company: appointment.company,
        phone: appointment.phone,
        email: appointment.email,
        day: appointmentDate.toISOString().split("T")[0],
        // ISO-Format: "2025-01-17"
        time: appointment.time,
        message: appointment.message,
        appointmentUrl,
        status: "cancelled",
        action: "cancelled"
      };
      try {
        await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        console.log(`✅ Customer cancellation notification sent to ${appointment.email}`);
      } catch (emailError) {
        console.error("Error sending customer cancellation notification:", emailError);
      }
      try {
        if (settings.emailNotifications && settings.adminEmail) {
          await sendAdminNotification(
            emailData,
            settings.adminEmail,
            locals?.runtime?.env
          );
          console.log(`✅ Admin cancellation notification sent to ${settings.adminEmail}`);
        }
      } catch (emailError) {
        console.error("Error sending admin cancellation notification:", emailError);
      }
      await createAuditLog(
        kv,
        "Termin storniert (Admin)",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin storniert. Zeitslot wurde freigegeben.`,
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
