"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, BookOpen, TrendingUp, Loader2 } from "lucide-react"
import { ActivityTimeline } from "@/components/activity-timeline"
import axios from "axios"

const API = "http://127.0.0.1:5000"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0, teachers: 0, courses: 0, presentToday: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, teachers, courses] = await Promise.all([
          axios.get(`${API}/students/`),
          axios.get(`${API}/teacher_details/`),
          axios.get(`${API}/courses/`),
        ])
        setStats({
          students:     students.data.length,
          teachers:     teachers.data.length,
          courses:      courses.data.length,
          presentToday: students.data.filter((s: any) => s.status === "enrolled").length,
        })
      } catch (error) {
        console.error("Failed to fetch stats", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { title: "Total Students",  value: stats.students,     icon: Users,      color: "text-blue-600",   bg: "bg-blue-50" },
    { title: "Total Teachers",  value: stats.teachers,     icon: UserCheck,  color: "text-green-600",  bg: "bg-green-50" },
    { title: "Total Courses",   value: stats.courses,      icon: BookOpen,   color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Enrolled",        value: stats.presentToday, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Flipflop Digital Learning Attendance System.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {isLoading
                      ? <Loader2 className="h-6 w-6 animate-spin mt-1 text-muted-foreground" />
                      : <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    }
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Timeline */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
