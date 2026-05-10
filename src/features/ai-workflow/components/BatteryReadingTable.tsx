import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { BatteryReading, BatteryStatus } from '../types/battery-reading.types'
import { useDeleteBatteryReading } from '../hooks/useBatteryReadings'

const statusVariant: Record<BatteryStatus, 'default' | 'secondary' | 'destructive'> = {
  Normal: 'default',
  Degrading: 'secondary',
  Failed: 'destructive',
}

interface Props {
  data: BatteryReading[] | undefined
  isLoading: boolean
  onEdit: (row: BatteryReading) => void
}

export function BatteryReadingTable({ data, isLoading, onEdit }: Props) {
  const deleteMutation = useDeleteBatteryReading()

  function handleDelete(row: BatteryReading) {
    toast.warning(`Xoá bản ghi ${row.batteryId}?`, {
      action: {
        label: 'Xoá',
        onClick: () => deleteMutation.mutate(row.id),
      },
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Battery ID</TableHead>
            <TableHead>Voltage (V)</TableHead>
            <TableHead>Current (A)</TableHead>
            <TableHead>Temp (°C)</TableHead>
            <TableHead>SOH (%)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            : data?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.batteryId}</TableCell>
                  <TableCell>{row.voltage.toFixed(2)}</TableCell>
                  <TableCell>{row.current.toFixed(2)}</TableCell>
                  <TableCell>{row.temperature.toFixed(1)}</TableCell>
                  <TableCell>{row.soh.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(row.timestamp).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(row)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
