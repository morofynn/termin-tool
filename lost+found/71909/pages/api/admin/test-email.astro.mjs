globalThis.process ??= {}; globalThis.process.env ??= {};
import { b as sendReminderEmail, s as sendCustomerNotification } from '../../../chunks/email_Cbsm-LWA.mjs';
import { a as getLongLabel } from '../../../chunks/event-config_Bu30ckYK.mjs';
export { renderers } from '../../../renderers.mjs';

const SETTINGS_KEY = "settings";
const POST = async ({ request, locals, url }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(
      JSON.stringify({ message: "KV store not available" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const body = await request.json();
    const { emailType } = body;
    if (!emailType) {
      return new Response(
        JSON.stringify({ message: "Missing emailType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    let adminEmail = "info@moro-gmbh.de";
    let settings = null;
    try {
      const settingsData = await KV.get(SETTINGS_KEY);
      if (settingsData) {
        settings = JSON.parse(settingsData);
        adminEmail = settings.adminEmail || adminEmail;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    const DAY_NAMES_FULL = {
      friday: getLongLabel("friday", settings),
      saturday: getLongLabel("saturday", settings),
      sunday: getLongLabel("sunday", settings)
    };
    const baseUrl = url.origin;
    const testAppointmentUrl = `${baseUrl}/termin/test-123`;
    const testData = {
      name: "Max Mustermann",
      company: "Musterfirma GmbH",
      phone: "+49 123 456789",
      email: adminEmail,
      // Test-E-Mail geht an Admin
      day: DAY_NAMES_FULL.friday,
      time: "10:30",
      message: "Dies ist eine Test-Nachricht für die E-Mail-Vorschau.",
      appointmentUrl: testAppointmentUrl,
      status: "confirmed",
      action: "confirmed"
    };
    let action = "confirmed";
    let status = "confirmed";
    switch (emailType) {
      case "requested":
        action = "requested";
        status = "pending";
        break;
      case "instant-booked":
        action = "instant-booked";
        status = "confirmed";
        break;
      case "confirmed":
        action = "confirmed";
        status = "confirmed";
        break;
      case "rejected":
        action = "rejected";
        status = "cancelled";
        break;
      case "cancelled":
        action = "cancelled";
        status = "cancelled";
        break;
      case "reminder":
        try {
          const sent = await sendReminderEmail(
            { ...testData, status: "confirmed", action: "confirmed" },
            locals?.runtime?.env
          );
          if (sent) {
            return new Response(
              JSON.stringify({
                success: true,
                message: `Test-Erinnerungs-E-Mail wurde an ${adminEmail} gesendet`
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Fehler beim Versenden der Test-E-Mail"
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch (error) {
          console.error("Error sending reminder test email:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Fehler beim Versenden der Test-E-Mail",
              error: error instanceof Error ? error.message : "Unknown error"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      default:
        return new Response(
          JSON.stringify({ message: "Invalid emailType" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    const emailData = {
      ...testData,
      status,
      action
    };
    try {
      const sent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );
      if (sent) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Test-E-Mail (${emailType}) wurde an ${adminEmail} gesendet`
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Fehler beim Versenden der Test-E-Mail"
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Fehler beim Versenden der Test-E-Mail",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Fehler beim Verarbeiten der Anfrage",
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
