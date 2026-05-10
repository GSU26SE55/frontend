import { format } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { BatteryReading } from '../../types/battery-reading.types'

interface Props {
  data: BatteryReading[]
  onEdit: (reading: BatteryReading) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function BatteryReadingTable({ data, onEdit, onDelete, isDeleting }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Battery ID</TableHead>
          <TableHead>Voltage (V)</TableHead>
          <TableHead>Current (A)</TableHead>
          <TableHead>Temperature (°C)</TableHead>
          <TableHead>Timestamp</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((reading, index) => (
          <TableRow key={reading.id}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">{reading.batteryId}</TableCell>
            <TableCell>{reading.voltage.toFixed(2)}</TableCell>
            <TableCell>{reading.current.toFixed(2)}</TableCell>
            <TableCell>{reading.temperature.toFixed(1)}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(reading.timestamp), 'dd/MM/yyyy HH:mm')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(reading)}
                  disabled={isDeleting}
                >
                  Sửa
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      Xóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bản ghi của <strong>{reading.batteryId}</strong> lúc{' '}
                        {format(new Date(reading.timestamp), 'HH:mm dd/MM/yyyy')} sẽ bị xóa vĩnh
                        viễn. Không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(reading.id)}>
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
