'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { LogOut, Settings, Activity, BookOpen, Users, Wrench, Server } from 'lucide-react'
import { PlacardLogo } from '@/components/PlacardLogo'

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const links = [
    { href: '/rooms',      label: 'Räume',      icon: Settings },
    { href: '/users',      label: 'Benutzer',   icon: Users    },
    { href: '/status',     label: 'Status',     icon: Activity },
    { href: '/setup',      label: 'Einrichtung',icon: Wrench   },
    { href: '/deployment', label: 'Deployment', icon: Server   },
    { href: '/guide',      label: 'Hardware',   icon: BookOpen },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/rooms" className="flex items-center gap-2.5 shrink-0">
            <PlacardLogo size={26} />
            <span className="font-semibold tracking-tight text-gray-900 text-sm">Placard</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </Link>
          <div className="flex gap-0.5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden md:block">{session?.user?.name}</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
