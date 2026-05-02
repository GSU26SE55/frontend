import { Outlet } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Solar Battery Maintenance</CardTitle>
          <CardDescription>Đăng nhập để truy cập hệ thống quản lý bảo trì pin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>
    </main>
  )
}
