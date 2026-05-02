import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <ShieldAlert className="size-10 text-destructive" aria-hidden="true" />
          <CardTitle>Không có quyền truy cập</CardTitle>
          <CardDescription>Tài khoản hiện tại không có quyền mở trang này.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonVariants()} to="/">
            Về trang chính
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
