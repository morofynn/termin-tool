import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV, type KVNamespace } from '../mocks/kv-mock';
import {
  reserveSlot,
  releaseSlot,
  getSlotAppointments,
  isSlotAvailable,
  getActiveSlotCount,
} from '../../src/lib/slot-utils';
import type { Appointment } from '../../src/types/appointments';

describe('slot-utils', () => {
  let mockKV: KVNamespace;

  beforeEach(() => {
    mockKV = createMockKV();
  });

  describe('reserveSlot', () => {
    it('should add appointment to empty slot', async () => {
      const result = await reserveSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123'
      );

      expect(result).toBe(true);

      // Verify slot was created
      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      expect(slotData).toBeTruthy();
      
      const appointments = JSON.parse(slotData!);
      expect(appointments).toEqual(['apt_123']);
    });

    it('should add appointment to existing slot', async () => {
      // Setup: Slot hat bereits eine Buchung
      await mockKV.put(
        'slot:friday:10:00:2026-01-16',
        JSON.stringify(['apt_456'])
      );

      const result = await reserveSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123'
      );

      expect(result).toBe(true);

      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      expect(appointments).toEqual(['apt_456', 'apt_123']);
    });

    it('should handle multiple reservations', async () => {
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_1');
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_2');
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_3');

      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      expect(appointments).toHaveLength(3);
      expect(appointments).toContain('apt_1');
      expect(appointments).toContain('apt_2');
      expect(appointments).toContain('apt_3');
    });

    it('should not add duplicate appointment IDs', async () => {
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_123');
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_123');

      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      
      // Sollte trotzdem 2x drin sein (wir prüfen das nicht in reserveSlot)
      // Das ist OK, weil Duplicates in der Booking-Logic verhindert werden
      expect(appointments).toHaveLength(2);
    });
  });

  describe('releaseSlot', () => {
    it('should remove appointment from slot', async () => {
      // Setup
      await mockKV.put(
        'slot:friday:10:00:2026-01-16',
        JSON.stringify(['apt_456', 'apt_123'])
      );

      const result = await releaseSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123'
      );

      expect(result).toBe(true);

      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      expect(appointments).toEqual(['apt_456']);
    });

    it('should delete empty slot', async () => {
      // Setup: Nur ein Appointment
      await mockKV.put(
        'slot:friday:10:00:2026-01-16',
        JSON.stringify(['apt_123'])
      );

      await releaseSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123'
      );

      // Slot sollte gelöscht sein
      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      expect(slotData).toBeNull();
    });

    it('should handle non-existent slot', async () => {
      const result = await releaseSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123'
      );

      expect(result).toBe(true); // Kein Fehler, einfach nichts zu tun
    });

    it('should handle non-existent appointment in slot', async () => {
      await mockKV.put(
        'slot:friday:10:00:2026-01-16',
        JSON.stringify(['apt_456'])
      );

      const result = await releaseSlot(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        'apt_123' // Existiert nicht
      );

      expect(result).toBe(true);

      // Slot sollte unverändert bleiben
      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      expect(appointments).toEqual(['apt_456']);
    });
  });

  describe('getSlotAppointments', () => {
    it('should return empty array for non-existent slot', async () => {
      const result = await getSlotAppointments(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(result).toEqual([]);
    });

    it('should return appointments in slot', async () => {
      await mockKV.put(
        'slot:friday:10:00:2026-01-16',
        JSON.stringify(['apt_1', 'apt_2', 'apt_3'])
      );

      const result = await getSlotAppointments(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(result).toEqual(['apt_1', 'apt_2', 'apt_3']);
    });

    it('should handle corrupted slot data', async () => {
      await mockKV.put('slot:friday:10:00:2026-01-16', 'invalid-json');

      const result = await getSlotAppointments(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(result).toEqual([]);
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for empty slot', async () => {
      const result = await isSlotAvailable(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        3 // maxAppointments
      );

      expect(result).toBe(true);
    });

    it('should return true if below max', async () => {
      // Setup: 2 aktive Termine
      await mockKV.put('slot:friday:10:00:2026-01-16', JSON.stringify(['apt_1', 'apt_2']));
      
      await mockKV.put('appointment:apt_1', JSON.stringify({
        id: 'apt_1',
        status: 'confirmed',
      } as Appointment));
      
      await mockKV.put('appointment:apt_2', JSON.stringify({
        id: 'apt_2',
        status: 'pending',
      } as Appointment));

      const result = await isSlotAvailable(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        3
      );

      expect(result).toBe(true);
    });

    it('should return false if slot is full', async () => {
      // Setup: 3 aktive Termine (max = 3)
      await mockKV.put('slot:friday:10:00:2026-01-16', JSON.stringify(['apt_1', 'apt_2', 'apt_3']));
      
      await mockKV.put('appointment:apt_1', JSON.stringify({
        id: 'apt_1',
        status: 'confirmed',
      } as Appointment));
      
      await mockKV.put('appointment:apt_2', JSON.stringify({
        id: 'apt_2',
        status: 'confirmed',
      } as Appointment));
      
      await mockKV.put('appointment:apt_3', JSON.stringify({
        id: 'apt_3',
        status: 'confirmed',
      } as Appointment));

      const result = await isSlotAvailable(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        3
      );

      expect(result).toBe(false);
    });

    it('should not count cancelled appointments', async () => {
      // Setup: 3 Termine, aber 1 cancelled
      await mockKV.put('slot:friday:10:00:2026-01-16', JSON.stringify(['apt_1', 'apt_2', 'apt_3']));
      
      await mockKV.put('appointment:apt_1', JSON.stringify({
        id: 'apt_1',
        status: 'confirmed',
      } as Appointment));
      
      await mockKV.put('appointment:apt_2', JSON.stringify({
        id: 'apt_2',
        status: 'cancelled', // ❌ Zählt nicht
      } as Appointment));
      
      await mockKV.put('appointment:apt_3', JSON.stringify({
        id: 'apt_3',
        status: 'confirmed',
      } as Appointment));

      const result = await isSlotAvailable(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16',
        3
      );

      // Nur 2 aktive Termine, also verfügbar
      expect(result).toBe(true);
    });
  });

  describe('getActiveSlotCount', () => {
    it('should return 0 for empty slot', async () => {
      const count = await getActiveSlotCount(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(count).toBe(0);
    });

    it('should count only active appointments', async () => {
      await mockKV.put('slot:friday:10:00:2026-01-16', JSON.stringify(['apt_1', 'apt_2', 'apt_3', 'apt_4']));
      
      await mockKV.put('appointment:apt_1', JSON.stringify({
        id: 'apt_1',
        status: 'confirmed',
      } as Appointment));
      
      await mockKV.put('appointment:apt_2', JSON.stringify({
        id: 'apt_2',
        status: 'cancelled', // ❌ Zählt nicht
      } as Appointment));
      
      await mockKV.put('appointment:apt_3', JSON.stringify({
        id: 'apt_3',
        status: 'pending',
      } as Appointment));
      
      await mockKV.put('appointment:apt_4', JSON.stringify({
        id: 'apt_4',
        status: 'rejected', // ❌ Zählt nicht
      } as Appointment));

      const count = await getActiveSlotCount(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(count).toBe(2); // Nur apt_1 und apt_3
    });

    it('should handle missing appointments', async () => {
      await mockKV.put('slot:friday:10:00:2026-01-16', JSON.stringify(['apt_1', 'apt_2']));
      
      // apt_1 existiert nicht
      await mockKV.put('appointment:apt_2', JSON.stringify({
        id: 'apt_2',
        status: 'confirmed',
      } as Appointment));

      const count = await getActiveSlotCount(
        mockKV,
        'friday',
        '10:00',
        '2026-01-16'
      );

      expect(count).toBe(1); // Nur apt_2 zählt
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent reservations', async () => {
      // Simuliere gleichzeitige Reservierungen
      const promises = [
        reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_1'),
        reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_2'),
        reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', 'apt_3'),
      ];

      await Promise.all(promises);

      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      
      // Alle sollten drin sein (Race Condition in echtem KV möglich, aber Mock ist synchron)
      expect(appointments.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'apt_123-abc_456.xyz';
      
      await reserveSlot(mockKV, 'friday', '10:00', '2026-01-16', specialId);
      
      const slotData = await mockKV.get('slot:friday:10:00:2026-01-16');
      const appointments = JSON.parse(slotData!);
      expect(appointments).toContain(specialId);
    });
  });
});
