import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Portal</CardTitle>
        <CardDescription>Quản lý user, battery config, SLA definition và audit log.</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>Admin</Badge>
      </CardContent>
    </Card>
  )
}
