import { Navigate } from 'react-router-dom'

import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function RootRedirect() {
  const user = useSessionStore((state) => state.user)
  const isHydrated = useSessionStore((state) => state.isHydrated)

  if (!isHydrated) {
    return <LoadingSpinner label="Đang khởi tạo phiên đăng nhập..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'Admin') {
    return <Navigate to="/admin" replace />
  }

  if (user.role === 'Manager') {
    return <Navigate to="/manager" replace />
  }

  if (user.role === 'Staff') {
    return <Navigate to="/staff" replace />
  }

  return <Navigate to="/unauthorized" replace />
}
