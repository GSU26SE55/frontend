export interface BatteryReading {
  id: string
  batteryId: string
  voltage: number
  current: number
  temperature: number
  timestamp: string
}

export type BatteryReadingFormValues = Omit<BatteryReading, 'id' | 'timestamp'>
