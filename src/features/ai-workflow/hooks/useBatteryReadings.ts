import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { batteryReadingService } from '../services/battery-reading.service'
import type { BatteryReadingFormValues } from '../types/battery-reading.types'

const QUERY_KEY = ['battery-readings']

export function useGetBatteryReadings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: batteryReadingService.getList,
    staleTime: 0,
  })
}

export function useCreateBatteryReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BatteryReadingFormValues) => batteryReadingService.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Thêm bản ghi thành công')
    },
    onError: () => toast.error('Thêm bản ghi thất bại'),
  })
}

export function useUpdateBatteryReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BatteryReadingFormValues }) =>
      batteryReadingService.update(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Cập nhật thành công')
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })
}

export function useDeleteBatteryReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => batteryReadingService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Đã xoá bản ghi')
    },
    onError: () => toast.error('Xoá thất bại'),
  })
}
