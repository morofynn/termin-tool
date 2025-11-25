/**
 * URL Utilities
 * 
 * Zentrale Funktionen zur URL-Generierung für Termine
 * Verwendet ADMIN_BASE_URL als Basis für alle URLs
 */

/**
 * Generiert die vollständige Termin-URL
 * 
 * @param appointmentId - Die ID des Termins
 * @param env - Environment Variables (optional)
 * @param fallbackOrigin - Fallback Origin wenn ADMIN_BASE_URL nicht gesetzt (optional)
 * @returns Vollständige Termin-URL
 * 
 * @example
 * // Mit ADMIN_BASE_URL gesetzt:
 * getAppointmentUrl('apt_123', env)
 * // → 'https://opti-termin.webflow.io/master/termin/apt_123'
 * 
 * // Ohne ADMIN_BASE_URL (Fallback):
 * getAppointmentUrl('apt_123', null, 'https://worker.dev')
 * // → 'https://worker.dev/termin/apt_123'
 */
export function getAppointmentUrl(
  appointmentId: string,
  env?: any,
  fallbackOrigin?: string
): string {
  // Hole ADMIN_BASE_URL aus Environment
  const adminBaseUrl = env?.ADMIN_BASE_URL || 
                      (typeof import.meta !== 'undefined' ? import.meta.env?.ADMIN_BASE_URL : null);
  
  // Verwende ADMIN_BASE_URL wenn gesetzt, sonst Fallback
  const baseUrl = adminBaseUrl || fallbackOrigin || '';
  
  // Entferne abschließenden Slash falls vorhanden
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Bilde die vollständige URL
  const appointmentUrl = `${cleanBaseUrl}/termin/${appointmentId}`;
  
  return appointmentUrl;
}

/**
 * Generiert die vollständige Admin-Panel URL
 * 
 * @param env - Environment Variables (optional)
 * @param fallbackOrigin - Fallback Origin wenn ADMIN_BASE_URL nicht gesetzt (optional)
 * @returns Vollständige Admin-Panel URL
 * 
 * @example
 * // Mit ADMIN_BASE_URL gesetzt:
 * getAdminPanelUrl(env)
 * // → 'https://opti-termin.webflow.io/master/secure-admin-panel-xyz789'
 */
export function getAdminPanelUrl(
  env?: any,
  fallbackOrigin?: string
): string {
  // Hole ADMIN_BASE_URL aus Environment
  const adminBaseUrl = env?.ADMIN_BASE_URL || 
                      (typeof import.meta !== 'undefined' ? import.meta.env?.ADMIN_BASE_URL : null);
  
  // Hole ADMIN_SECRET_PATH
  const adminSecretPath = env?.ADMIN_SECRET_PATH || 
                         (typeof import.meta !== 'undefined' ? import.meta.env?.ADMIN_SECRET_PATH : null) ||
                         'secure-admin-panel-xyz789';
  
  // Verwende ADMIN_BASE_URL wenn gesetzt, sonst Fallback
  const baseUrl = adminBaseUrl || fallbackOrigin || '';
  
  // Entferne abschließenden Slash falls vorhanden
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Bilde die vollständige URL
  const adminPanelUrl = `${cleanBaseUrl}/${adminSecretPath}`;
  
  return adminPanelUrl;
}

/**
 * Extrahiert die Termin-ID aus einer vollständigen Termin-URL
 * 
 * @param appointmentUrl - Die vollständige Termin-URL
 * @returns Die extrahierte Termin-ID oder null
 * 
 * @example
 * getAppointmentIdFromUrl('https://opti-termin.webflow.io/master/termin/apt_123')
 * // → 'apt_123'
 */
export function getAppointmentIdFromUrl(appointmentUrl: string): string | null {
  const match = appointmentUrl.match(/\/termin\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Extrahiert die Base URL aus einer vollständigen Termin-URL
 * 
 * @param appointmentUrl - Die vollständige Termin-URL
 * @returns Die Base URL
 * 
 * @example
 * getBaseUrlFromAppointmentUrl('https://opti-termin.webflow.io/master/termin/apt_123')
 * // → 'https://opti-termin.webflow.io/master'
 */
export function getBaseUrlFromAppointmentUrl(appointmentUrl: string): string {
  return appointmentUrl.split('/termin/')[0];
}
