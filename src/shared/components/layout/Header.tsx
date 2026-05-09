import Cookies from 'js-cookie'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function Header() {
  const { user, logout } = useSessionStore()

  function handleLogout() {
    Cookies.remove('accesstoken')
    Cookies.remove('refreshtoken')
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <span className="text-sm text-muted-foreground">
        {user?.role} Portal
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{user?.fullName}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
