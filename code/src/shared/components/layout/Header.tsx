import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/shared/context/useAuth'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function Header() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const user = useSessionStore((state) => state.user)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm text-muted-foreground">Maintenance Management</p>
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        {user?.role ? <Badge variant="secondary">{user.role}</Badge> : null}
        <Button type="button" variant="outline" onClick={handleLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </Button>
      </div>
    </header>
  )
}
