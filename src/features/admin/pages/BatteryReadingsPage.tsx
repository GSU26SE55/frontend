import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'
import { BatteryReadingForm } from '../components/battery-readings/BatteryReadingForm'
import { BatteryReadingTable } from '../components/battery-readings/BatteryReadingTable'
import {
  useBatteryReadingList,
  useCreateReading,
  useDeleteReading,
  useUpdateReading,
} from '../hooks/useBatteryReadings'
import type { BatteryReading, BatteryReadingFormValues } from '../types/battery-reading.types'

export function BatteryReadingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BatteryReading | null>(null)

  const { data = [], isLoading, isError } = useBatteryReadingList()
  const createMutation = useCreateReading()
  const updateMutation = useUpdateReading()
  const deleteMutation = useDeleteReading()

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(reading: BatteryReading) {
    setEditTarget(reading)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditTarget(null)
  }

  function handleSubmit(values: BatteryReadingFormValues) {
    if (editTarget === null) {
      createMutation.mutate(values, { onSuccess: closeDialog })
    } else {
      updateMutation.mutate({ id: editTarget.id, values }, { onSuccess: closeDialog })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Battery Readings</h1>
        <Button onClick={openCreate}>+ Thêm mới</Button>
      </div>

      {isLoading && <LoadingSpinner className="py-16" />}

      {isError && (
        <EmptyState title="Có lỗi xảy ra" description="Không thể tải dữ liệu." />
      )}

      {!isLoading && !isError && data.length === 0 && (
        <EmptyState
          title="Chưa có dữ liệu đo"
          description="Nhấn Thêm mới để tạo bản ghi đầu tiên."
        />
      )}

      {!isLoading && !isError && data.length > 0 && (
        <BatteryReadingTable
          data={data}
          onEdit={openEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Chỉnh sửa' : 'Thêm mới'} Battery Reading
            </DialogTitle>
          </DialogHeader>
          <BatteryReadingForm
            defaultValues={
              editTarget
                ? {
                    batteryId: editTarget.batteryId,
                    voltage: editTarget.voltage,
                    current: editTarget.current,
                    temperature: editTarget.temperature,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
