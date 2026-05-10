import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { BatteryReadingFormValues } from '../../types/battery-reading.types'

const BATTERY_IDS = ['BAT-001', 'BAT-002', 'BAT-003'] as const

const schema = z.object({
  batteryId: z.string().min(1, 'Bắt buộc chọn pin'),
  voltage: z.number({ message: 'Phải là số' }).min(0, 'Min 0V').max(5, 'Max 5V'),
  current: z.number({ message: 'Phải là số' }).min(-10, 'Min -10A').max(10, 'Max 10A'),
  temperature: z.number({ message: 'Phải là số' }).min(-20, 'Min -20°C').max(80, 'Max 80°C'),
})

interface Props {
  defaultValues?: BatteryReadingFormValues
  onSubmit: (values: BatteryReadingFormValues) => void
  isPending: boolean
}

export function BatteryReadingForm({ defaultValues, onSubmit, isPending }: Props) {
  const form = useForm<BatteryReadingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      batteryId: '',
      voltage: 0,
      current: 0,
      temperature: 0,
    },
  })

  const isEdit = defaultValues !== undefined

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="batteryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Battery ID</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn pin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BATTERY_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="voltage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Voltage (V) — 0 đến 5</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="current"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current (A) — -10 đến 10</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature (°C) — -20 đến 80</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isEdit ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </form>
    </Form>
  )
}
