import Sidebar from './Sidebar'
import { getSessionUser } from '@/lib/auth'

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 bg-[#0a0a0f] overflow-auto">
        {children}
      </main>
    </div>
  )
}
