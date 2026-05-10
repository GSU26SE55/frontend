export type BatteryStatus = 'Normal' | 'Degrading' | 'Failed'

export interface BatteryReading {
  id: string
  batteryId: string
  voltage: number
  current: number
  temperature: number
  soh: number
  status: BatteryStatus
  timestamp: string
}

export interface BatteryReadingFormValues {
  batteryId: string
  voltage: number
  current: number
  temperature: number
  soh: number
  status: BatteryStatus
}
