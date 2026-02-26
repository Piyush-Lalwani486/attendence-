"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ArrowLeft, Filter, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

const API = "http://127.0.0.1:5000"

interface AttendanceRecord { id: number; student_name: string; course: string; date: string; status: string }

export default function StudentAttendanceRecordsPage() {
  const [date, setDate]                 = useState<Date | undefined>(undefined)
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [records, setRecords]           = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true)
        const res = await axios.get<AttendanceRecord[]>(`${API}/attendance/records`)
        setRecords(res.data)
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load attendance history." })
      } finally { setIsLoading(false) }
    }
    fetchRecords()
  }, [])

  const filteredRecords = records.filter(record => {
    const matchesCourse = selectedCourse === "all" || record.course.toLowerCase() === selectedCourse.toLowerCase()
    const matchesDate   = !date || new Date(record.date + "T00:00:00").toDateString() === date.toDateString()
    return matchesCourse && matchesDate
  })

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Link href="/student-attendance">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Attendance Records</h1>
            <p className="text-muted-foreground text-sm">View historical attendance data.</p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" />Filter Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Sort by Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 bg-background", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "All Dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setDate(undefined)}>Clear Date Filter</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Sort by Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-10 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="cpdm">CPDM</SelectItem>
                    <SelectItem value="agdm">AGDM</SelectItem>
                    <SelectItem value="aacp">AACP</SelectItem>
                    <SelectItem value="frontend">Frontend Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-border/50 overflow-hidden min-h-[200px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" /><p>Loading records...</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="h-10 px-4 align-middle">Date</th>
                      <th className="h-10 px-4 align-middle">Student Name</th>
                      <th className="h-10 px-4 align-middle">Course</th>
                      <th className="h-10 px-4 align-middle text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
                    ) : filteredRecords.map(record => (
                      <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="p-4 align-middle font-medium">{record.date ? format(new Date(record.date + "T00:00:00"), "MMM d, yyyy") : "N/A"}</td>
                        <td className="p-4 align-middle">{record.student_name}</td>
                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{record.course}</span>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            record.status === "Present" && "bg-green-100 text-green-800",
                            record.status === "Absent"  && "bg-red-100 text-red-800",
                            record.status === "Late"    && "bg-yellow-100 text-yellow-800",
                            record.status === "Excused" && "bg-gray-100 text-gray-800",
                          )}>{record.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Showing {filteredRecords.length} of {records.length} records</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
