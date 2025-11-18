globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const POST = async ({ locals, request }) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, message: "KV namespace not available" }),
        { status: 500, headers: corsHeaders }
      );
    }
    const defaultSettings = {
      showLocationField: true,
      showMessageField: true,
      requireLocation: false,
      requireMessage: false,
      locationPlaceholder: "z.B. München, Berlin, etc.",
      messagePlaceholder: "Ihre Nachricht (optional)",
      enableEmailNotifications: false,
      adminEmail: "",
      emailSubject: "Neue Terminbuchung",
      emailTemplate: "Es wurde ein neuer Termin gebucht:\n\nName: {{name}}\nE-Mail: {{email}}\nTelefon: {{phone}}\nTag: {{day}}\nUhrzeit: {{time}}",
      enableGoogleCalendar: false,
      googleCalendarEmail: "",
      friday: {
        slots: {
          "09:00": 3,
          "09:30": 3,
          "10:00": 3,
          "10:30": 3,
          "11:00": 3,
          "11:30": 3,
          "12:00": 3,
          "12:30": 3,
          "13:00": 3,
          "13:30": 3,
          "14:00": 3,
          "14:30": 3,
          "15:00": 3,
          "15:30": 3,
          "16:00": 3,
          "16:30": 3,
          "17:00": 3,
          "17:30": 3,
          "18:00": 3,
          "18:30": 3
        }
      },
      saturday: {
        slots: {
          "09:00": 3,
          "09:30": 3,
          "10:00": 3,
          "10:30": 3,
          "11:00": 3,
          "11:30": 3,
          "12:00": 3,
          "12:30": 3,
          "13:00": 3,
          "13:30": 3,
          "14:00": 3,
          "14:30": 3,
          "15:00": 3,
          "15:30": 3,
          "16:00": 3,
          "16:30": 3,
          "17:00": 3,
          "17:30": 3,
          "18:00": 3,
          "18:30": 3
        }
      },
      sunday: {
        slots: {
          "09:00": 3,
          "09:30": 3,
          "10:00": 3,
          "10:30": 3,
          "11:00": 3,
          "11:30": 3,
          "12:00": 3,
          "12:30": 3,
          "13:00": 3,
          "13:30": 3,
          "14:00": 3,
          "14:30": 3,
          "15:00": 3,
          "15:30": 3,
          "16:00": 3,
          "16:30": 3,
          "17:00": 3,
          "17:30": 3,
          "18:00": 3,
          "18:30": 3
        }
      }
    };
    await kv.put(
      "settings",
      JSON.stringify(defaultSettings),
      { expirationTtl: 60 * 60 * 24 * 90 }
      // 90 Tage
    );
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const auditEntry = {
      id: auditId,
      action: "Einstellungen zurückgesetzt",
      details: "Alle Einstellungen wurden auf die Standardwerte zurückgesetzt.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userEmail: "admin",
      appointmentId: null
    };
    await kv.put(
      `audit:${auditId}`,
      JSON.stringify(auditEntry),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    const auditListData = await kv.get("audit:list");
    const auditList = auditListData ? JSON.parse(auditListData) : [];
    auditList.unshift(auditId);
    await kv.put(
      "audit:list",
      JSON.stringify(auditList),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Einstellungen wurden erfolgreich zurückgesetzt",
        settings: defaultSettings
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Reset settings error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Fehler beim Zurücksetzen der Einstellungen",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
