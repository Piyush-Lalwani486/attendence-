"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard, Users, UserCheck, FileText, Settings,
  Menu, X, ChevronLeft, LogOut, User, BookOpen, GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"

interface DashboardLayoutProps { children: React.ReactNode }

const navigation = [
  { name: "Dashboard",          href: "/dashboard",          icon: LayoutDashboard },
  { name: "Student Attendance", href: "/student-attendance", icon: Users },
  { name: "Students Data",      href: "/student-data",       icon: GraduationCap },
  { name: "Teacher Attendance", href: "/teacher-attendance", icon: UserCheck },
  { name: "Teachers",           href: "/teachers",           icon: User },
  { name: "Courses",            href: "/courses",            icon: BookOpen },
  { name: "Reports",            href: "/reports",            icon: FileText },
  { name: "Settings",           href: "/settings",           icon: Settings },
]

function Sidebar({ collapsed = false, mobile = false, onClose }: { collapsed?: boolean; mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed && !mobile ? "w-16" : "w-64",
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image src="/images/whatsapp-20image-202025-12-18-20at-2012.jpeg" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-sm leading-tight">Flipflop Digital<br/>Learning</span>
          </div>
        )}
        {mobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent ml-auto">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} onClick={() => mobile && onClose?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobile) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex relative">
        <Sidebar collapsed={collapsed} />
        <Button
          variant="ghost" size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-muted z-10"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 animate-slide-in">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-sm font-bold text-foreground">Flipflop Digital Learning</h2>
              <p className="text-xs text-muted-foreground">Attendance Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium">Admin</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@flipflop.edu</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/")} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
