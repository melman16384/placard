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
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <PlacardLogo size={28} />
            <span className="font-semibold tracking-tight text-gray-900">Placard</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <div className="flex gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{session?.user?.name}</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </div>
    </nav>
  )
}
