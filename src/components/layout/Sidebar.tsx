'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: UserProfile
}

const repLinks = [
  { href: '/dashboard/rep', label: 'Dashboard', icon: '▦' },
  { href: '/simulate', label: 'Roleplay', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: '◎' },
]

const managerLinks = [
  { href: '/dashboard/manager', label: 'Team Overview', icon: '▦' },
  { href: '/team', label: 'My Team', icon: '◉' },
  { href: '/assignments', label: 'Assignments', icon: '◫' },
  { href: '/simulate', label: 'Roleplay', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: '◎' },
  { href: '/personas', label: 'Personas', icon: '◭' },
  { href: '/knowledge', label: 'Knowledge Base', icon: '◈' },
  { href: '/company', label: 'Playbook', icon: '◫' },
  { href: '/hire', label: 'Hiring', icon: '◉' },
]

const bottomLinks = [
  { href: '/settings', label: 'Settings', icon: '⚙' },
  { href: '/architecture', label: 'Architecture', icon: '⬡' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = user.role === 'manager' ? managerLinks : repLinks

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0d0d1a] border-r border-white/5 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-white text-sm tracking-tight">SalesOS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
              pathname === link.href
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            )}
          >
            <span className="text-base leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-white/5">
          {bottomLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                pathname === link.href
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/5'
              )}
            >
              <span className="text-base leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] mb-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs text-indigo-300 font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{user.name}</div>
            <div className="text-[10px] text-white/30 capitalize">{user.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-white/30 hover:text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
