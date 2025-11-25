import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV, type KVNamespace } from '../mocks/kv-mock';
import {
  getAppointment,
  saveAppointment,
  deleteAppointment,
  getAllAppointments,
  getSettings,
  saveSettings,
  addToAppointmentsList,
  removeFromAppointmentsList,
} from '../../src/lib/kv-utils';
import { DEFAULT_SETTINGS } from '../../src/lib/constants';
import type { Appointment, Settings } from '../../src/types/appointments';

describe('kv-utils', () => {
  let mockKV: KVNamespace;

  beforeEach(() => {
    mockKV = createMockKV();
  });

  describe('getAppointment', () => {
    it('should return null if appointment not found', async () => {
      const result = await getAppointment(mockKV, 'apt_123');
      expect(result).toBeNull();
    });

    it('should return parsed appointment', async () => {
      const appointment: Appointment = {
        id: 'apt_123',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      await mockKV.put(`appointment:${appointment.id}`, JSON.stringify(appointment));

      const result = await getAppointment(mockKV, 'apt_123');
      expect(result).toEqual(appointment);
    });

    it('should handle corrupted data', async () => {
      await mockKV.put('appointment:apt_123', 'invalid-json');
      const result = await getAppointment(mockKV, 'apt_123');
      expect(result).toBeNull();
    });
  });

  describe('saveAppointment', () => {
    it('should save appointment to KV', async () => {
      const appointment: Appointment = {
        id: 'apt_123',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      const result = await saveAppointment(mockKV, appointment);
      expect(result).toBe(true);

      // Verify it was saved
      const saved = await mockKV.get(`appointment:${appointment.id}`);
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual(appointment);
    });

    it('should update existing appointment', async () => {
      const appointment: Appointment = {
        id: 'apt_123',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(mockKV, appointment);

      // Update status
      appointment.status = 'confirmed';
      appointment.updatedAt = new Date().toISOString();
      
      await saveAppointment(mockKV, appointment);

      // Verify update
      const saved = await getAppointment(mockKV, 'apt_123');
      expect(saved?.status).toBe('confirmed');
      expect(saved?.updatedAt).toBeTruthy();
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment from KV', async () => {
      const appointment: Appointment = {
        id: 'apt_123',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(mockKV, appointment);
      expect(await getAppointment(mockKV, 'apt_123')).toBeTruthy();

      const result = await deleteAppointment(mockKV, 'apt_123');
      expect(result).toBe(true);

      expect(await getAppointment(mockKV, 'apt_123')).toBeNull();
    });

    it('should handle non-existent appointment', async () => {
      const result = await deleteAppointment(mockKV, 'apt_999');
      expect(result).toBe(true); // Kein Fehler
    });
  });

  describe('getAllAppointments', () => {
    it('should return empty array if no appointments', async () => {
      const result = await getAllAppointments(mockKV);
      expect(result).toEqual([]);
    });

    it('should return all appointments', async () => {
      const apt1: Appointment = {
        id: 'apt_1',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      const apt2: Appointment = {
        id: 'apt_2',
        day: 'saturday',
        time: '14:00',
        name: 'Anna Schmidt',
        phone: '+49987654321',
        email: 'anna@example.com',
        appointmentDate: '2026-01-17T14:00:00.000Z',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(mockKV, apt1);
      await saveAppointment(mockKV, apt2);
      await addToAppointmentsList(mockKV, 'apt_1');
      await addToAppointmentsList(mockKV, 'apt_2');

      const result = await getAllAppointments(mockKV);
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toContain('apt_1');
      expect(result.map(a => a.id)).toContain('apt_2');
    });

    it('should handle missing appointments in list', async () => {
      await addToAppointmentsList(mockKV, 'apt_1');
      await addToAppointmentsList(mockKV, 'apt_2');
      
      // Nur apt_1 existiert wirklich
      await saveAppointment(mockKV, {
        id: 'apt_1',
        day: 'friday',
        time: '10:00',
        name: 'Max',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });

      const result = await getAllAppointments(mockKV);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('apt_1');
    });
  });

  describe('getSettings', () => {
    it('should return defaults if no settings found', async () => {
      const result = await getSettings(mockKV);
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge with defaults', async () => {
      const partialSettings: Partial<Settings> = {
        companyName: 'Test GmbH',
        maxAppointmentsPerSlot: 5,
      };

      await mockKV.put('settings', JSON.stringify(partialSettings));

      const result = await getSettings(mockKV);
      expect(result.companyName).toBe('Test GmbH');
      expect(result.maxAppointmentsPerSlot).toBe(5);
      expect(result.bookingMode).toBe(DEFAULT_SETTINGS.bookingMode);
      expect(result.adminEmail).toBe(DEFAULT_SETTINGS.adminEmail);
    });

    it('should handle corrupted settings', async () => {
      await mockKV.put('settings', 'invalid-json');
      const result = await getSettings(mockKV);
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('should preserve all settings fields', async () => {
      const customSettings: Settings = {
        ...DEFAULT_SETTINGS,
        companyName: 'Custom Company',
        primaryColor: '#FF5733',
        eventName: 'OPTI',
        eventYear: 2026,
      };

      await saveSettings(mockKV, customSettings);
      const result = await getSettings(mockKV);
      
      expect(result.companyName).toBe('Custom Company');
      expect(result.primaryColor).toBe('#FF5733');
      expect(result.eventName).toBe('OPTI');
      expect(result.eventYear).toBe(2026);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to KV', async () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        companyName: 'New Company',
        maxAppointmentsPerSlot: 10,
      };

      const result = await saveSettings(mockKV, settings);
      expect(result).toBe(true);

      const saved = await getSettings(mockKV);
      expect(saved.companyName).toBe('New Company');
      expect(saved.maxAppointmentsPerSlot).toBe(10);
    });

    it('should update existing settings', async () => {
      await saveSettings(mockKV, {
        ...DEFAULT_SETTINGS,
        companyName: 'Old Company',
      });

      await saveSettings(mockKV, {
        ...DEFAULT_SETTINGS,
        companyName: 'New Company',
      });

      const saved = await getSettings(mockKV);
      expect(saved.companyName).toBe('New Company');
    });
  });

  describe('addToAppointmentsList', () => {
    it('should add appointment to empty list', async () => {
      const result = await addToAppointmentsList(mockKV, 'apt_123');
      expect(result).toBe(true);

      const listData = await mockKV.get('appointments:list');
      const list = JSON.parse(listData!);
      expect(list).toEqual(['apt_123']);
    });

    it('should add appointment to existing list', async () => {
      await addToAppointmentsList(mockKV, 'apt_1');
      await addToAppointmentsList(mockKV, 'apt_2');
      await addToAppointmentsList(mockKV, 'apt_3');

      const listData = await mockKV.get('appointments:list');
      const list = JSON.parse(listData!);
      expect(list).toHaveLength(3);
      expect(list).toContain('apt_1');
      expect(list).toContain('apt_2');
      expect(list).toContain('apt_3');
    });

    it('should allow duplicate IDs', async () => {
      // In der echten Anwendung sollte das nicht passieren, aber Utils erlauben es
      await addToAppointmentsList(mockKV, 'apt_123');
      await addToAppointmentsList(mockKV, 'apt_123');

      const listData = await mockKV.get('appointments:list');
      const list = JSON.parse(listData!);
      expect(list).toHaveLength(2);
    });
  });

  describe('removeFromAppointmentsList', () => {
    it('should remove appointment from list', async () => {
      await addToAppointmentsList(mockKV, 'apt_1');
      await addToAppointmentsList(mockKV, 'apt_2');
      await addToAppointmentsList(mockKV, 'apt_3');

      const result = await removeFromAppointmentsList(mockKV, 'apt_2');
      expect(result).toBe(true);

      const listData = await mockKV.get('appointments:list');
      const list = JSON.parse(listData!);
      expect(list).toHaveLength(2);
      expect(list).not.toContain('apt_2');
    });

    it('should handle empty list', async () => {
      const result = await removeFromAppointmentsList(mockKV, 'apt_123');
      expect(result).toBe(true); // Kein Fehler
    });

    it('should handle non-existent appointment', async () => {
      await addToAppointmentsList(mockKV, 'apt_1');
      
      const result = await removeFromAppointmentsList(mockKV, 'apt_999');
      expect(result).toBe(true);

      const listData = await mockKV.get('appointments:list');
      const list = JSON.parse(listData!);
      expect(list).toEqual(['apt_1']);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete appointment lifecycle', async () => {
      // 1. Create appointment
      const appointment: Appointment = {
        id: 'apt_123',
        day: 'friday',
        time: '10:00',
        name: 'Max Mustermann',
        phone: '+49123456789',
        email: 'max@example.com',
        appointmentDate: '2026-01-16T10:00:00.000Z',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(mockKV, appointment);
      await addToAppointmentsList(mockKV, appointment.id);

      // 2. Verify it's saved
      const saved = await getAppointment(mockKV, 'apt_123');
      expect(saved).toBeTruthy();

      // 3. Update status
      appointment.status = 'confirmed';
      appointment.updatedAt = new Date().toISOString();
      await saveAppointment(mockKV, appointment);

      // 4. Verify update
      const updated = await getAppointment(mockKV, 'apt_123');
      expect(updated?.status).toBe('confirmed');

      // 5. Delete appointment
      await deleteAppointment(mockKV, 'apt_123');
      await removeFromAppointmentsList(mockKV, 'apt_123');

      // 6. Verify deletion
      const deleted = await getAppointment(mockKV, 'apt_123');
      expect(deleted).toBeNull();

      const allAppointments = await getAllAppointments(mockKV);
      expect(allAppointments).toHaveLength(0);
    });

    it('should handle multiple appointments efficiently', async () => {
      const appointments: Appointment[] = [];
      
      for (let i = 1; i <= 50; i++) {
        const apt: Appointment = {
          id: `apt_${i}`,
          day: 'friday',
          time: '10:00',
          name: `User ${i}`,
          phone: '+49123456789',
          email: `user${i}@example.com`,
          appointmentDate: '2026-01-16T10:00:00.000Z',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        
        appointments.push(apt);
        await saveAppointment(mockKV, apt);
        await addToAppointmentsList(mockKV, apt.id);
      }

      const allAppointments = await getAllAppointments(mockKV);
      expect(allAppointments).toHaveLength(50);
    });
  });
});
