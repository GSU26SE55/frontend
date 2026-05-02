import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function StaffDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Portal</CardTitle>
        <CardDescription>Danh sách ticket được giao và maintenance log.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>Staff</Badge>
      </CardContent>
    </Card>
  )
}
