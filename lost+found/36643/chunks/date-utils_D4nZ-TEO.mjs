globalThis.process ??= {}; globalThis.process.env ??= {};
function createBerlinDate(isoDate, time) {
  if (time) {
    return /* @__PURE__ */ new Date(`${isoDate}T${time}:00+01:00`);
  } else {
    return /* @__PURE__ */ new Date(`${isoDate}T00:00:00+01:00`);
  }
}
function validateAndParseBerlinDate(dateString) {
  try {
    if (!dateString) return null;
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(dateString)) {
      const date2 = createBerlinDate(dateString);
      if (isNaN(date2.getTime())) {
        console.error(`Invalid date: ${dateString}`);
        return null;
      }
      return date2;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
}
function createAppointmentDateTime(isoDate, time) {
  const date = createBerlinDate(isoDate, time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const [hours, minutes] = time.split(":");
  return `${year}-${month}-${day}T${hours}:${minutes}:00+01:00`;
}

export { createAppointmentDateTime as c, validateAndParseBerlinDate as v };
