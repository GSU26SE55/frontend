import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createReading,
  deleteReading,
  getList,
  updateReading,
} from '../services/battery-reading.mock'
import type { BatteryReadingFormValues } from '../types/battery-reading.types'

const QUERY_KEY = ['battery-readings'] as const

export function useBatteryReadingList() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getList, staleTime: 0 })
}

export function useCreateReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BatteryReadingFormValues) => createReading(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Thêm thành công')
    },
    onError: () => toast.error('Thêm thất bại'),
  })
}

export function useUpdateReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BatteryReadingFormValues }) =>
      updateReading(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Cập nhật thành công')
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })
}

export function useDeleteReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Đã xóa')
    },
    onError: () => toast.error('Xóa thất bại'),
  })
}
