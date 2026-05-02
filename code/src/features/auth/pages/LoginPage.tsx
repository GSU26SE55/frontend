import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  return (
    <form className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="name@example.com" disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" type="password" placeholder="••••••••" disabled />
      </div>
      <Button type="button" disabled>
        Đăng nhập
      </Button>
      <p className="text-sm text-muted-foreground">
        Login API sẽ được triển khai ở ticket auth riêng. Trang này dùng để kiểm tra layout và route scaffold.
      </p>
    </form>
  )
}
