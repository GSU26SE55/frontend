import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { BatteryReadingTable } from '../components/BatteryReadingTable'
import { BatteryReadingFormDialog } from '../components/BatteryReadingFormDialog'
import {
  useGetBatteryReadings,
  useCreateBatteryReading,
  useUpdateBatteryReading,
} from '../hooks/useBatteryReadings'
import type { BatteryReading, BatteryReadingFormValues } from '../types/battery-reading.types'

export function AIWorkflowPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BatteryReading | undefined>()

  const { data, isLoading } = useGetBatteryReadings()
  const createMutation = useCreateBatteryReading()
  const updateMutation = useUpdateBatteryReading()

  function openCreate() {
    setEditTarget(undefined)
    setDialogOpen(true)
  }

  function openEdit(row: BatteryReading) {
    setEditTarget(row)
    setDialogOpen(true)
  }

  function handleSubmit(values: BatteryReadingFormValues) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, values },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createMutation.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Workflow — Battery Readings</h1>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Mock CRUD để kiểm tra workflow FE
            <Badge variant="outline" className="text-xs">Sprint 1 · KAN-418</Badge>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm bản ghi
        </Button>
      </div>

      <BatteryReadingTable data={data} isLoading={isLoading} onEdit={openEdit} />

      <BatteryReadingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editTarget}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  )
}
