import Sidebar from '@/components/layout/Sidebar'
import { DEMO_USER } from '@/lib/demo'

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={DEMO_USER} />
      <main className="flex-1 bg-[#0a0a0f] overflow-auto">
        {children}
      </main>
    </div>
  )
}
