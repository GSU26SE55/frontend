import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ManagerDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manager Portal</CardTitle>
        <CardDescription>Dashboard tổng quan, ticket queue và báo cáo SLA.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>Manager</Badge>
      </CardContent>
    </Card>
  )
}
