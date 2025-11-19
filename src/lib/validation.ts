/**
 * Validation Utilities mit XSS-Schutz
 * 
 * Zentrale Validierungsfunktionen für Input-Validierung,
 * Sanitization und XSS-Schutz
 */

/**
 * XSS-geschützte HTML-Escape Funktion
 * Verwendet für alle User-Inputs die in HTML/Emails gerendert werden
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validiert E-Mail Adresse (RFC 5322 simplified)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Alias für Backward Compatibility
export const isValidEmail = validateEmail;

/**
 * Validiert Telefonnummer (International & Deutsch)
 */
export function validatePhone(phone: string): boolean {
  // Erlaubt: +49, 0049, 0xxx, spaces, -, /, ()
  const phoneRegex = /^[\d\s\-\+\(\)\/]+$/;
  const cleaned = phone.replace(/\s/g, '');
  return phoneRegex.test(phone) && cleaned.length >= 6 && cleaned.length <= 20;
}

/**
 * Validiert Namen (Min 2 Zeichen, erlaubt Buchstaben, Umlaute, Bindestriche, Leerzeichen)
 */
export function validateName(name: string): boolean {
  const nameRegex = /^[a-zA-ZäöüÄÖÜß\s\-]{2,100}$/;
  return nameRegex.test(name);
}

/**
 * Validiert Firmenname (Optional, erlaubt mehr Zeichen)
 */
export function validateCompany(company: string): boolean {
  if (!company) return true; // Optional
  const companyRegex = /^[a-zA-Z0-9äöüÄÖÜß\s\-\.,&()]{1,200}$/;
  return companyRegex.test(company);
}

/**
 * Validiert Message/Textarea (Max length, keine Scripts)
 */
export function validateMessage(message: string): boolean {
  if (!message) return true; // Optional
  if (message.length > 1000) return false;
  
  // Blocke <script>, <iframe>, javascript:
  const dangerousPatterns = [/<script/i, /<iframe/i, /javascript:/i, /on\w+=/i];
  return !dangerousPatterns.some(pattern => pattern.test(message));
}

/**
 * Sanitize Input - entfernt gefährliche Zeichen
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validiert ISO Date String
 */
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validiert Appointment Day (friday, saturday, sunday)
 */
export function validateDay(day: string): boolean {
  return ['friday', 'saturday', 'sunday'].includes(day);
}

/**
 * Validiert Time Format (HH:MM)
 */
export function validateTime(time: string): boolean {
  if (!time) return true; // Optional für Form-Validierung
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validiert Appointment Status
 */
export function validateStatus(status: string): boolean {
  return ['pending', 'confirmed', 'cancelled'].includes(status);
}

/**
 * Kombinierte Validierung für Appointment Booking
 */
export interface AppointmentValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: {
    name: string;
    company?: string;
    phone: string;
    email: string;
    message?: string;
    time?: string;
  };
}

export function validateAppointmentBooking(data: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message?: string;
  day: string;
  time: string;
  date: string;
}): AppointmentValidationResult {
  const errors: Record<string, string> = {};
  
  // Name
  if (!validateName(data.name)) {
    errors.name = 'Ungültiger Name (min. 2 Zeichen, nur Buchstaben)';
  }
  
  // Email
  if (!validateEmail(data.email)) {
    errors.email = 'Ungültige E-Mail Adresse';
  }
  
  // Phone
  if (!validatePhone(data.phone)) {
    errors.phone = 'Ungültige Telefonnummer';
  }
  
  // Company (optional)
  if (data.company && !validateCompany(data.company)) {
    errors.company = 'Ungültiger Firmenname';
  }
  
  // Message (optional)
  if (data.message && !validateMessage(data.message)) {
    errors.message = 'Nachricht enthält ungültige Zeichen oder ist zu lang';
  }
  
  // Day
  if (!validateDay(data.day)) {
    errors.day = 'Ungültiger Tag';
  }
  
  // Time
  if (!validateTime(data.time)) {
    errors.time = 'Ungültige Uhrzeit';
  }
  
  // Date
  if (!validateDate(data.date)) {
    errors.date = 'Ungültiges Datum';
  }
  
  const valid = Object.keys(errors).length === 0;
  
  return {
    valid,
    errors,
    ...(valid && {
      sanitized: {
        name: sanitizeInput(data.name),
        company: data.company ? sanitizeInput(data.company) : undefined,
        phone: sanitizeInput(data.phone),
        email: sanitizeInput(data.email),
        message: data.message ? sanitizeInput(data.message) : undefined,
        time: data.time,
      }
    })
  };
}

/**
 * Sanitize gesamtes Appointment Object
 */
export function sanitizeAppointmentData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  // String-Felder sanitizen
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * Vereinfachte Validierung für Form Data
 * (für Backwards Compatibility mit existierendem Code)
 * 
 * WICHTIG: Diese Funktion wird im Frontend verwendet OHNE time,
 * weil time separat verwaltet wird (selectedTime State)
 */
export function validateFormData(data: {
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  time?: string;
}): AppointmentValidationResult {
  const errors: Record<string, string> = {};
  
  // Name
  if (!data.name || !validateName(data.name)) {
    errors.name = 'Ungültiger Name (min. 2 Zeichen, nur Buchstaben)';
  }
  
  // Email
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Ungültige E-Mail Adresse';
  }
  
  // Phone
  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Ungültige Telefonnummer';
  }
  
  // Company (optional)
  if (data.company && !validateCompany(data.company)) {
    errors.company = 'Ungültiger Firmenname';
  }
  
  // Message (optional)
  if (data.message && !validateMessage(data.message)) {
    errors.message = 'Nachricht enthält ungültige Zeichen oder ist zu lang';
  }
  
  // Time (optional - nur wenn mitgegeben)
  if (data.time && !validateTime(data.time)) {
    errors.time = 'Ungültige Uhrzeit';
  }
  
  const valid = Object.keys(errors).length === 0;
  
  return {
    valid,
    errors,
    ...(valid && {
      sanitized: {
        name: sanitizeInput(data.name),
        company: data.company ? sanitizeInput(data.company) : undefined,
        phone: sanitizeInput(data.phone),
        email: sanitizeInput(data.email),
        message: data.message ? sanitizeInput(data.message) : undefined,
        time: data.time,
      }
    })
  };
}
