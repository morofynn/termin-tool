globalThis.process ??= {}; globalThis.process.env ??= {};
import { b as sendReminderEmail } from '../../chunks/email_Do5PROAM.mjs';
import { c as createAuditLog } from '../../chunks/audit-log_D4J27ZDp.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ locals, url }) => {
  try {
    console.log("🔔 Starting reminder email job...");
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error("KV namespace not available");
      return new Response(
        JSON.stringify({ message: "KV store not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const allAppointmentsKey = "appointments:list";
    const existingList = await kv.get(allAppointmentsKey);
    const appointmentIds = existingList ? JSON.parse(existingList) : [];
    console.log(`📋 Found ${appointmentIds.length} total appointments`);
    const now = /* @__PURE__ */ new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1e3);
    let remindersSent = 0;
    let remindersFailed = 0;
    const processedAppointments = [];
    for (const aptId of appointmentIds) {
      try {
        const aptData = await kv.get(`appointment:${aptId}`);
        if (!aptData) continue;
        const appointment = JSON.parse(aptData);
        if (appointment.status !== "confirmed") {
          continue;
        }
        const appointmentDate = new Date(appointment.appointmentDate);
        if (appointmentDate >= in24Hours && appointmentDate <= in25Hours) {
          console.log(`⏰ Sending reminder for appointment ${aptId} (${appointment.name})`);
          const reminderSentKey = `reminder_sent:${aptId}`;
          const alreadySent = await kv.get(reminderSentKey);
          if (alreadySent) {
            console.log(`⏭️ Reminder already sent for ${aptId}, skipping`);
            continue;
          }
          const baseUrl = url.origin;
          const appointmentUrl = `${baseUrl}/termin/${aptId}`;
          try {
            const emailSent = await sendReminderEmail(
              {
                name: appointment.name,
                email: appointment.email,
                day: appointmentDate.toISOString().split("T")[0],
                time: appointment.time,
                company: appointment.company,
                phone: appointment.phone,
                appointmentUrl
              },
              locals?.runtime?.env
            );
            if (emailSent) {
              remindersSent++;
              processedAppointments.push(`${appointment.name} (${appointment.email})`);
              await kv.put(reminderSentKey, "true", { expirationTtl: 60 * 60 * 24 * 7 });
              await createAuditLog(
                kv,
                "Erinnerungs-E-Mail",
                `Erinnerung wurde an ${appointment.email} gesendet für Termin am ${appointmentDate.toISOString().split("T")[0]} um ${appointment.time} Uhr.`,
                appointment.id,
                "system"
              );
              console.log(`✅ Reminder sent to ${appointment.email}`);
            } else {
              remindersFailed++;
              console.error(`❌ Failed to send reminder to ${appointment.email}`);
              await createAuditLog(
                kv,
                "E-Mail fehlgeschlagen",
                `Erinnerung konnte nicht an ${appointment.email} gesendet werden.`,
                appointment.id,
                "system"
              );
            }
          } catch (emailError) {
            remindersFailed++;
            console.error(`❌ Error sending reminder to ${appointment.email}:`, emailError);
            await createAuditLog(
              kv,
              "E-Mail fehlgeschlagen",
              `Fehler beim Senden der Erinnerung an ${appointment.email}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`,
              appointment.id,
              "system"
            );
          }
        }
      } catch (error) {
        console.error(`Error processing appointment ${aptId}:`, error);
        remindersFailed++;
      }
    }
    console.log(`✅ Reminder job complete: ${remindersSent} sent, ${remindersFailed} failed`);
    if (remindersSent > 0 || remindersFailed > 0) {
      await createAuditLog(
        kv,
        "Erinnerungs-Job",
        `Erinnerungs-E-Mails versendet: ${remindersSent} erfolgreich, ${remindersFailed} fehlgeschlagen.`,
        void 0,
        "system"
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        remindersFailed,
        processedAppointments,
        message: `Reminder job complete: ${remindersSent} sent, ${remindersFailed} failed`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Reminder job error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error running reminder job",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const GET = async (context) => {
  return POST(context);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
