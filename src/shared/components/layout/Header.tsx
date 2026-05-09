import { Bell, LogOut } from 'lucide-react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function Header() {
  const user = useSessionStore((s) => s.user)
  const logout = useSessionStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b bg-background px-6">
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{user?.fullName?.[0] ?? 'U'}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{user?.fullName}</span>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  )
}
