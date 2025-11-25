globalThis.process ??= {}; globalThis.process.env ??= {};
import { g as getAppointmentUrl, b as sendReminderEmail, s as sendCustomerNotification, a as sendAdminNotification } from '../../../chunks/url-utils_DFkUyZnU.mjs';
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
    const testAppointmentUrl = getAppointmentUrl("test-123", locals?.runtime?.env, url.origin);
    const testData = {
      name: "Max Mustermann",
      company: "Musterfirma GmbH",
      phone: "+49 123 456789",
      email: adminEmail,
      // Test-E-Mail geht an Admin
      day: "2025-01-24",
      // Freitag (ISO-Format)
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
    const results = [];
    let allSuccess = true;
    try {
      console.log(`📧 Sending customer version to admin (${adminEmail})...`);
      const customerSent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );
      if (customerSent) {
        results.push(`✅ Kunden-E-Mail (${emailType})`);
      } else {
        results.push(`❌ Kunden-E-Mail (${emailType}) fehlgeschlagen`);
        allSuccess = false;
      }
      if (["requested", "instant-booked", "confirmed", "cancelled", "rejected"].includes(action)) {
        console.log(`📧 Sending admin version to admin (${adminEmail})...`);
        const adminSent = await sendAdminNotification(
          emailData,
          adminEmail,
          locals?.runtime?.env
        );
        if (adminSent) {
          results.push(`✅ Admin-E-Mail (${emailType})`);
        } else {
          results.push(`❌ Admin-E-Mail (${emailType}) fehlgeschlagen`);
          allSuccess = false;
        }
      }
      return new Response(
        JSON.stringify({
          success: allSuccess,
          message: allSuccess ? `Beide Test-E-Mails (${emailType}) wurden an ${adminEmail} gesendet:
${results.join("\n")}` : `Fehler beim Versenden einiger Test-E-Mails:
${results.join("\n")}`,
          results
        }),
        { status: allSuccess ? 200 : 500, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error sending test emails:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Fehler beim Versenden der Test-E-Mails",
          error: error instanceof Error ? error.message : "Unknown error",
          results
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
