import type { BatteryReading, BatteryReadingFormValues } from '../types/battery-reading.types'
import { mockBatteryReadings } from '../data/mock-data'

let store: BatteryReading[] = [...mockBatteryReadings]

const delay = () => new Promise<void>((res) => setTimeout(res, 100))

export const batteryReadingService = {
  async getList(): Promise<BatteryReading[]> {
    await delay()
    return [...store]
  },

  async create(values: BatteryReadingFormValues): Promise<BatteryReading> {
    await delay()
    const item: BatteryReading = {
      id: crypto.randomUUID(),
      ...values,
      timestamp: new Date().toISOString(),
    }
    store = [...store, item]
    return item
  },

  async update(id: string, values: BatteryReadingFormValues): Promise<BatteryReading> {
    await delay()
    const index = store.findIndex((r) => r.id === id)
    if (index === -1) throw new Error('Không tìm thấy bản ghi')
    const updated: BatteryReading = { ...store[index], ...values }
    store = store.map((r) => (r.id === id ? updated : r))
    return updated
  },

  async remove(id: string): Promise<void> {
    await delay()
    store = store.filter((r) => r.id !== id)
  },
}
