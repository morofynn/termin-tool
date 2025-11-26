globalThis.process ??= {}; globalThis.process.env ??= {};
function generateSlotKey(day, time, dateKey) {
  return `slot:${day}:${time}:${dateKey}`;
}
function extractDateKey(appointmentDate) {
  return appointmentDate.split("T")[0];
}
async function reserveSlot(kv, day, time, dateKey, appointmentId) {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const existingSlotData = await kv.get(slotKey);
    const slotAppointments = existingSlotData ? JSON.parse(existingSlotData) : [];
    slotAppointments.push(appointmentId);
    await kv.put(
      slotKey,
      JSON.stringify(slotAppointments),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    console.log(`✅ Slot reserved: ${slotKey} (${slotAppointments.length} appointments)`);
    return true;
  } catch (error) {
    console.error("❌ Error reserving slot:", error);
    return false;
  }
}
async function releaseSlot(kv, day, time, dateKey, appointmentId) {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const existingSlotData = await kv.get(slotKey);
    if (!existingSlotData) {
      console.warn(`⚠️ Slot not found during release: ${slotKey}`);
      return true;
    }
    const slotAppointments = JSON.parse(existingSlotData);
    const updatedSlotAppointments = slotAppointments.filter((id) => id !== appointmentId);
    if (updatedSlotAppointments.length > 0) {
      await kv.put(
        slotKey,
        JSON.stringify(updatedSlotAppointments),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
      console.log(`✅ Slot released: ${slotKey} (${slotAppointments.length} -> ${updatedSlotAppointments.length})`);
    } else {
      await kv.delete(slotKey);
      console.log(`✅ Empty slot deleted: ${slotKey}`);
    }
    return true;
  } catch (error) {
    console.error("❌ Error releasing slot:", error);
    return false;
  }
}
async function getSlotAppointments(kv, day, time, dateKey) {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const slotData = await kv.get(slotKey);
    if (!slotData) {
      return [];
    }
    return JSON.parse(slotData);
  } catch (error) {
    console.error("❌ Error getting slot appointments:", error);
    return [];
  }
}
const getSlotBookings = getSlotAppointments;
async function getActiveSlotCount(kv, day, time, dateKey) {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const slotData = await kv.get(slotKey);
    if (!slotData) {
      return 0;
    }
    const appointmentIds = JSON.parse(slotData);
    let activeCount = 0;
    for (const aptId of appointmentIds) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt = JSON.parse(aptData);
        if (apt.status !== "cancelled" && apt.status !== "rejected") {
          activeCount++;
        }
      }
    }
    return activeCount;
  } catch (error) {
    console.error("❌ Error counting active bookings:", error);
    return 0;
  }
}
async function isSlotAvailable(kv, day, time, dateKey, maxAppointments) {
  const activeCount = await getActiveSlotCount(kv, day, time, dateKey);
  return activeCount < maxAppointments;
}

export { reserveSlot as a, extractDateKey as e, getSlotBookings as g, isSlotAvailable as i, releaseSlot as r };
