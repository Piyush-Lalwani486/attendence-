"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StaffManagement } from "@/components/staff-management"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage system settings and staff access.</p>
        </div>
        <StaffManagement />
      </div>
    </DashboardLayout>
  )
}
