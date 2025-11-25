import { describe, it, expect } from 'vitest';
import {
  createBerlinDate,
  formatDateForDisplay,
  formatTimeForDisplay,
  validateAndParseBerlinDate,
  createAppointmentDateTime,
  isEventInPast,
} from '../../src/lib/date-utils';

describe('date-utils', () => {
  describe('createBerlinDate', () => {
    it('should create date with time in Berlin timezone', () => {
      const date = createBerlinDate('2026-01-16', '14:30');
      expect(date).toBeInstanceOf(Date);
      
      // Berlin ist UTC+1 im Winter
      const hours = date.getUTCHours();
      expect(hours).toBe(13); // 14:30 Berlin = 13:30 UTC
    });

    it('should create midnight date without time', () => {
      const date = createBerlinDate('2026-01-16');
      expect(date.getUTCHours()).toBe(23); // 00:00 Berlin = 23:00 UTC (previous day)
    });

    it('should handle summer time correctly', () => {
      const date = createBerlinDate('2026-07-15', '14:00');
      // Berlin ist UTC+2 im Sommer
      const hours = date.getUTCHours();
      expect(hours).toBe(12); // 14:00 Berlin = 12:00 UTC
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date in German format', () => {
      const formatted = formatDateForDisplay('2026-01-16');
      expect(formatted).toMatch(/16\. Januar 2026/);
    });

    it('should handle invalid dates', () => {
      const formatted = formatDateForDisplay('invalid');
      expect(formatted).toBe('Ungültiges Datum');
    });

    it('should return default for empty string', () => {
      const formatted = formatDateForDisplay('');
      expect(formatted).toBe('Kein Datum');
    });
  });

  describe('formatTimeForDisplay', () => {
    it('should format time correctly', () => {
      expect(formatTimeForDisplay('14:30')).toBe('14:30');
      expect(formatTimeForDisplay('09:00')).toBe('09:00');
    });

    it('should handle invalid time', () => {
      expect(formatTimeForDisplay('invalid')).toBe('invalid');
    });
  });

  describe('validateAndParseBerlinDate', () => {
    it('should return null for invalid date', () => {
      expect(validateAndParseBerlinDate('invalid')).toBeNull();
      expect(validateAndParseBerlinDate('')).toBeNull();
      expect(validateAndParseBerlinDate('2026-13-45')).toBeNull();
    });

    it('should parse valid ISO date', () => {
      const result = validateAndParseBerlinDate('2026-01-16');
      expect(result).toBeInstanceOf(Date);
    });

    it('should parse date from ISO timestamp', () => {
      const result = validateAndParseBerlinDate('2026-01-16T14:30:00Z');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('createAppointmentDateTime', () => {
    it('should combine date and time', () => {
      const result = createAppointmentDateTime('2026-01-16', '14:30');
      expect(result).toMatch(/2026-01-16T\d{2}:30:00/);
    });

    it('should handle midnight time', () => {
      const result = createAppointmentDateTime('2026-01-16', '00:00');
      expect(result).toMatch(/2026-01-16/);
    });

    it('should handle noon time', () => {
      const result = createAppointmentDateTime('2026-01-16', '12:00');
      expect(result).toMatch(/2026-01-16T11:00:00/); // UTC+1
    });
  });

  describe('isEventInPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isEventInPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isEventInPast(futureDate)).toBe(false);
    });

    it('should handle today correctly', () => {
      const today = new Date();
      // Heute ist NICHT in der Vergangenheit
      expect(isEventInPast(today)).toBe(false);
    });

    it('should handle string dates', () => {
      expect(isEventInPast(new Date('2020-01-01'))).toBe(true);
      expect(isEventInPast(new Date('2030-01-01'))).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const leapDay = createBerlinDate('2024-02-29', '12:00');
      expect(leapDay).toBeInstanceOf(Date);
      expect(leapDay.getDate()).toBe(29);
    });

    it('should handle year boundaries', () => {
      const newYear = createBerlinDate('2026-01-01', '00:00');
      expect(newYear).toBeInstanceOf(Date);
    });

    it('should handle day boundaries', () => {
      const endOfDay = createBerlinDate('2026-01-16', '23:59');
      expect(endOfDay).toBeInstanceOf(Date);
    });
  });
});
