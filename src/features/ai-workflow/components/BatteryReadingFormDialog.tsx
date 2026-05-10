import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import type { BatteryReading, BatteryReadingFormValues } from '../types/battery-reading.types'

const schema = z.object({
  batteryId: z.string().min(1, 'Bắt buộc'),
  voltage: z.coerce.number().positive('Phải > 0'),
  current: z.coerce.number().min(-10).max(10),
  temperature: z.coerce.number().min(0).max(80),
  soh: z.coerce.number().min(0).max(100),
  status: z.enum(['Normal', 'Degrading', 'Failed']),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: BatteryReading
  onSubmit: (values: BatteryReadingFormValues) => void
  isPending: boolean
}

export function BatteryReadingFormDialog({ open, onOpenChange, defaultValues, onSubmit, isPending }: Props) {
  const form = useForm<BatteryReadingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      batteryId: '',
      voltage: 0,
      current: 0,
      temperature: 0,
      soh: 100,
      status: 'Normal',
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        batteryId: defaultValues.batteryId,
        voltage: defaultValues.voltage,
        current: defaultValues.current,
        temperature: defaultValues.temperature,
        soh: defaultValues.soh,
        status: defaultValues.status,
      })
    } else {
      form.reset({ batteryId: '', voltage: 0, current: 0, temperature: 0, soh: 100, status: 'Normal' })
    }
  }, [defaultValues, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Cập nhật bản ghi' : 'Thêm bản ghi mới'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="batteryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery ID</FormLabel>
                  <FormControl><Input placeholder="B0005" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="voltage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltage (V)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current (A)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="soh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SOH (%)</FormLabel>
                    <FormControl><Input type="number" step="0.1" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      {...field}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Degrading">Degrading</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang lưu...' : defaultValues ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
