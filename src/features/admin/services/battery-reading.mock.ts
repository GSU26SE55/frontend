import type { BatteryReading, BatteryReadingFormValues } from '../types/battery-reading.types'

let store: BatteryReading[] = [
  {
    id: '1',
    batteryId: 'BAT-001',
    voltage: 4.1,
    current: 1.2,
    temperature: 28,
    timestamp: '2026-05-10T06:00:00.000Z',
  },
  {
    id: '2',
    batteryId: 'BAT-002',
    voltage: 3.8,
    current: -0.5,
    temperature: 32,
    timestamp: '2026-05-10T07:00:00.000Z',
  },
  {
    id: '3',
    batteryId: 'BAT-003',
    voltage: 4.2,
    current: 2.0,
    temperature: 41,
    timestamp: '2026-05-10T08:00:00.000Z',
  },
  {
    id: '4',
    batteryId: 'BAT-001',
    voltage: 3.7,
    current: -1.0,
    temperature: 25,
    timestamp: '2026-05-10T09:00:00.000Z',
  },
  {
    id: '5',
    batteryId: 'BAT-002',
    voltage: 3.9,
    current: 0.8,
    temperature: 35,
    timestamp: '2026-05-10T10:00:00.000Z',
  },
]

export async function getList(): Promise<BatteryReading[]> {
  return [...store]
}

export async function createReading(values: BatteryReadingFormValues): Promise<BatteryReading> {
  const record: BatteryReading = {
    ...values,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
  store = [record, ...store]
  return record
}

export async function updateReading(
  id: string,
  values: BatteryReadingFormValues,
): Promise<BatteryReading> {
  const idx = store.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Reading not found')
  store[idx] = { ...store[idx], ...values }
  return store[idx]
}

export async function deleteReading(id: string): Promise<void> {
  store = store.filter((r) => r.id !== id)
}
