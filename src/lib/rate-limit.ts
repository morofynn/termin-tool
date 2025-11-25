/**
 * Rate Limiting Utilities
 * 
 * Verhindert Spam und Missbrauch durch Limitierung der Anfragen pro IP-Adresse.
 */

import type { RateLimitEntry, Settings } from '../types/appointments';
import { KV_KEYS } from './constants';

/**
 * Prüft ob eine IP-Adresse rate-limited ist
 * 
 * @param ip - Die IP-Adresse des Clients
 * @param kv - KV Store
 * @param settings - Aktuelle Einstellungen
 * @returns true wenn erlaubt, false wenn rate-limited
 */
export async function checkRateLimit(
  ip: string,
  kv: KVNamespace,
  settings: Settings
): Promise<{ allowed: boolean; remaining?: number; resetAt?: string }> {
  // Wenn Rate Limiting deaktiviert ist, immer erlauben
  if (!settings.rateLimitingEnabled) {
    return { allowed: true };
  }

  const key = KV_KEYS.RATE_LIMIT(ip);
  const now = new Date();
  const windowMs = settings.rateLimitWindowMinutes * 60 * 1000;

  try {
    // Aktuelle Rate Limit Daten abrufen
    const existingData = await kv.get(key);
    
    if (!existingData) {
      // Erste Anfrage von dieser IP
      const newEntry: RateLimitEntry = {
        ip,
        requests: 1,
        firstRequest: now.toISOString(),
        lastRequest: now.toISOString(),
      };

      // Mit TTL speichern (Zeitfenster + Puffer)
      await kv.put(
        key,
        JSON.stringify(newEntry),
        { expirationTtl: Math.ceil(windowMs / 1000) + 60 }
      );

      return {
        allowed: true,
        remaining: settings.rateLimitMaxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs).toISOString(),
      };
    }

    // Bestehende Daten parsen
    const entry: RateLimitEntry = JSON.parse(existingData);
    const firstRequestTime = new Date(entry.firstRequest);
    const timeSinceFirst = now.getTime() - firstRequestTime.getTime();

    // Zeitfenster abgelaufen? Reset!
    if (timeSinceFirst > windowMs) {
      const newEntry: RateLimitEntry = {
        ip,
        requests: 1,
        firstRequest: now.toISOString(),
        lastRequest: now.toISOString(),
      };

      await kv.put(
        key,
        JSON.stringify(newEntry),
        { expirationTtl: Math.ceil(windowMs / 1000) + 60 }
      );

      return {
        allowed: true,
        remaining: settings.rateLimitMaxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs).toISOString(),
      };
    }

    // Limit erreicht?
    if (entry.requests >= settings.rateLimitMaxRequests) {
      const resetAt = new Date(firstRequestTime.getTime() + windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt.toISOString(),
      };
    }

    // Anfrage zählen
    entry.requests += 1;
    entry.lastRequest = now.toISOString();

    await kv.put(
      key,
      JSON.stringify(entry),
      { expirationTtl: Math.ceil(windowMs / 1000) + 60 }
    );

    return {
      allowed: true,
      remaining: settings.rateLimitMaxRequests - entry.requests,
      resetAt: new Date(firstRequestTime.getTime() + windowMs).toISOString(),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Bei Fehler: Erlauben (fail-open)
    return { allowed: true };
  }
}

/**
 * Extrahiert die IP-Adresse aus dem Request
 * 
 * @param request - Astro Request Objekt
 * @returns IP-Adresse oder 'unknown'
 */
export function getClientIP(request: Request): string {
  // Cloudflare Headers prüfen
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback zu Standard-Headers
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return 'unknown';
}

/**
 * Reset Rate Limit für eine IP (Admin-Funktion)
 * 
 * @param ip - Die IP-Adresse
 * @param kv - KV Store
 */
export async function resetRateLimit(ip: string, kv: KVNamespace): Promise<void> {
  const key = KV_KEYS.RATE_LIMIT(ip);
  await kv.delete(key);
}

/**
 * Hole alle aktiven Rate Limits (Admin-Funktion)
 * 
 * @param kv - KV Store
 * @returns Liste aller Rate Limit Einträge
 */
export async function getAllRateLimits(kv: KVNamespace): Promise<RateLimitEntry[]> {
  try {
    const list = await kv.list({ prefix: 'ratelimit:' });
    const entries: RateLimitEntry[] = [];

    for (const key of list.keys) {
      const data = await kv.get(key.name);
      if (data) {
        entries.push(JSON.parse(data));
      }
    }

    return entries;
  } catch (error) {
    console.error('Failed to get rate limits:', error);
    return [];
  }
}
