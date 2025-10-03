'use client'

import { useState } from 'react'
import { Menu, Home, ClipboardList, Users, LogOut, X } from 'lucide-react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import * as Avatar from '@radix-ui/react-avatar'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
//import MenuBar from '../components/MenuBar'


export default function NavbarWithSidebar() {
  const [open, setOpen] = useState(false)
  const { data: session, status } = useSession()
 
  if (status !== 'authenticated' || !session?.user) return null

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-background shadow-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          <h1 className="font-bold text-lg">SSW Steel Center</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Sidebar Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )}

      {/* Slide-in Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-background shadow-lg z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-foreground">Menu</h2>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Menu Links */}
        <nav className="flex flex-col px-4 py-2 space-y-2">
          <SidebarItem icon={<Home size={20} />} label="Dashboard" href="/dashboard" />
          <SidebarItem icon={<ClipboardList size={20} />} label="Orders" href="/orders" />
          <SidebarItem icon={<Users size={20} />} label="Staffs" href="/staff" />
          <ThemeToggle/>

        </nav>

        {/* Bottom Avatar */}
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 mb-2">
            <Avatar.Root className="w-10 h-10 rounded-full bg-background overflow-hidden">
              {session.user.image ? <Avatar.Image
                src={session.user.image || ''}
                className="w-full h-full object-cover"
                alt={session.user.name ?? ''}
              />:
              <Avatar.Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA1YK7AzLFlNa7rz_sxokNpo7RO-PHrJpvJQ&s" className="w-full h-full object-cover" />}
            </Avatar.Root>
            <div className="text-sm">
              <p className="font-semibold">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-600 text-sm hover:bg-red-100 px-2 py-1 rounded flex items-center gap-1"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

function SidebarItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm text-foreground transition"
    >
      {icon}
      {label}
    </Link>
  )
}
