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
    const listData = await kv.get("appointments:list");
    const appointmentIds = listData ? JSON.parse(listData) : [];
    const deletedAppointments = appointmentIds.length;
    await kv.put(
      "appointments:list",
      JSON.stringify([]),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    for (const aptId of appointmentIds) {
      try {
        await kv.put(`appointment:${aptId}`, "null", { expirationTtl: 1 });
      } catch (e) {
        console.warn(`Could not clear appointment ${aptId}:`, e);
      }
    }
    const auditListData = await kv.get("audit:list");
    const auditIds = auditListData ? JSON.parse(auditListData) : [];
    const deletedAudits = auditIds.length;
    await kv.put(
      "audit:list",
      JSON.stringify([]),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    for (const auditId of auditIds) {
      try {
        await kv.put(`audit:${auditId}`, "null", { expirationTtl: 1 });
      } catch (e) {
        console.warn(`Could not clear audit log ${auditId}:`, e);
      }
    }
    const days = ["friday", "saturday", "sunday"];
    const times = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30"
    ];
    const dates = ["2026-01-16", "2026-01-17", "2026-01-18"];
    for (const day of days) {
      for (const time of times) {
        for (const date of dates) {
          const slotKey = `slot:${day}:${time}:${date}`;
          try {
            await kv.put(slotKey, "[]", { expirationTtl: 1 });
          } catch (e) {
            console.warn(`Could not clear slot ${slotKey}:`, e);
          }
        }
      }
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
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Kompletter Reset erfolgreich durchgeführt",
        deletedAppointments,
        deletedAudits
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Nuclear reset error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Fehler beim kompletten Reset",
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
