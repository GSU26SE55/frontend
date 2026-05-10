import type { BatteryReading } from '../types/battery-reading.types'

export const mockBatteryReadings: BatteryReading[] = [
  { id: '1', batteryId: 'B0005', voltage: 4.19, current: -1.5, temperature: 24.3, soh: 98.2, status: 'Normal', timestamp: '2026-05-10T08:00:00.000Z' },
  { id: '2', batteryId: 'B0005', voltage: 3.85, current: -1.5, temperature: 25.1, soh: 91.4, status: 'Normal', timestamp: '2026-05-10T09:00:00.000Z' },
  { id: '3', batteryId: 'B0006', voltage: 3.72, current: -1.5, temperature: 27.8, soh: 84.7, status: 'Degrading', timestamp: '2026-05-10T08:30:00.000Z' },
  { id: '4', batteryId: 'B0006', voltage: 3.54, current: -1.5, temperature: 31.2, soh: 76.3, status: 'Degrading', timestamp: '2026-05-10T09:30:00.000Z' },
  { id: '5', batteryId: 'B0007', voltage: 3.31, current: -1.5, temperature: 38.9, soh: 61.5, status: 'Degrading', timestamp: '2026-05-10T08:15:00.000Z' },
  { id: '6', batteryId: 'B0007', voltage: 3.02, current: -1.5, temperature: 45.2, soh: 47.8, status: 'Failed', timestamp: '2026-05-10T09:15:00.000Z' },
  { id: '7', batteryId: 'B0018', voltage: 4.17, current: -1.5, temperature: 23.6, soh: 96.1, status: 'Normal', timestamp: '2026-05-10T08:45:00.000Z' },
  { id: '8', batteryId: 'B0018', voltage: 3.91, current: -1.5, temperature: 24.9, soh: 89.3, status: 'Normal', timestamp: '2026-05-10T09:45:00.000Z' },
  { id: '9', batteryId: 'B0005', voltage: 3.66, current: -1.5, temperature: 28.4, soh: 79.6, status: 'Degrading', timestamp: '2026-05-10T10:00:00.000Z' },
  { id: '10', batteryId: 'B0018', voltage: 2.98, current: -1.5, temperature: 47.1, soh: 42.2, status: 'Failed', timestamp: '2026-05-10T10:15:00.000Z' },
]
