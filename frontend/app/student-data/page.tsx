"use client"

import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, User, Edit, Trash2, Loader2, X, UserCheck, UserMinus } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

const API = "http://127.0.0.1:5000"

interface Course { id: number; name: string }
interface Student {
  id: number; first_name: string; last_name: string
  age: number; joining_date: string | null; courses: string[]; course: string | null; status: string
}

interface CourseSelectorProps {
  allCourses: Course[]
  selectedCourseIds: number[]
  onToggle: (id: number) => void
}

const CourseSelector = memo(({ allCourses, selectedCourseIds, onToggle }: CourseSelectorProps) => (
  <div className="space-y-2">
    <Label>Enroll in Courses</Label>
    {allCourses.length === 0
      ? <p className="text-sm text-muted-foreground">No courses available. Add courses first.</p>
      : <div className="grid grid-cols-2 gap-2">
          {allCourses.map(course => (
            <label key={course.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm transition-colors ${selectedCourseIds.includes(course.id) ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50"}`}>
              <input type="checkbox" className="hidden" checked={selectedCourseIds.includes(course.id)} onChange={() => onToggle(course.id)} />
              {selectedCourseIds.includes(course.id) ? "✓" : "○"} {course.name}
            </label>
          ))}
        </div>
    }
  </div>
))
CourseSelector.displayName = "CourseSelector"

interface ModalFormProps {
  firstName: string; onFirstName: (v: string) => void
  lastName: string; onLastName: (v: string) => void
  age: string; onAge: (v: string) => void
  joiningDate: string; onJoiningDate: (v: string) => void
  allCourses: Course[]; selectedCourseIds: number[]; onToggleCourse: (id: number) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  isSaving: boolean
  submitLabel: string
}

const ModalForm = memo(({
  firstName, onFirstName, lastName, onLastName,
  age, onAge, joiningDate, onJoiningDate,
  allCourses, selectedCourseIds, onToggleCourse,
  onSubmit, onClose, isSaving, submitLabel
}: ModalFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={e => onFirstName(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={e => onLastName(e.target.value)} required /></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Age</Label><Input type="number" value={age} onChange={e => onAge(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={joiningDate} onChange={e => onJoiningDate(e.target.value)} required /></div>
    </div>
    <CourseSelector allCourses={allCourses} selectedCourseIds={selectedCourseIds} onToggle={onToggleCourse} />
    <div className="flex gap-3 pt-4 border-t">
      <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSaving}>
        {isSaving ? "Saving..." : submitLabel}
      </Button>
    </div>
  </form>
))
ModalForm.displayName = "ModalForm"

interface EnrollModalProps {
  student: Student | null
  allCourses: Course[]
  onClose: () => void
  onSave: (studentId: number, courseIds: number[]) => Promise<void>
  isSaving: boolean
}

const EnrollModal = memo(({ student, allCourses, onClose, onSave, isSaving }: EnrollModalProps) => {
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    if (student && allCourses.length > 0) {
      setSelected(allCourses.filter(c => student.courses.includes(c.name)).map(c => c.id))
    }
  }, [student, allCourses])

  const toggle = useCallback((id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }, [])

  if (!student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl bg-background border-border relative m-4">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 text-muted-foreground" onClick={onClose}><X className="h-4 w-4" /></Button>
        <CardHeader><CardTitle>Manage Enrollment — {student.first_name} {student.last_name}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <CourseSelector allCourses={allCourses} selectedCourseIds={selected} onToggle={toggle} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSaving}
              onClick={() => onSave(student.id, selected)}
            >
              {isSaving ? "Saving..." : "Save Enrollment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
EnrollModal.displayName = "EnrollModal"

export default function StudentDirectoryPage() {
  const [students, setStudents]     = useState<Student[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [isAddOpen, setIsAddOpen]   = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving]     = useState(false)
  const [currentId, setCurrentId]   = useState<number | null>(null)
  const [firstName, setFirstName]   = useState("")
  const [lastName, setLastName]     = useState("")
  const [age, setAge]               = useState("")
  const [joiningDate, setJoiningDate] = useState("")
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])

  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null)
  const [isEnrollSaving, setIsEnrollSaving] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchCourses()
  }, [])

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      const res = await axios.get<Student[]>(`${API}/students/`)
      setStudents(res.data)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load students." })
    } finally { setIsLoading(false) }
  }

  const fetchCourses = async () => {
    try {
      const res = await axios.get<Course[]>(`${API}/students/courses/all`)
      setAllCourses(res.data)
    } catch (e) { console.error("Failed to load courses", e) }
  }

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Delete this student?")) return
    try {
      await axios.delete(`${API}/students/${id}`)
      toast({ title: "Student Deleted" })
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to delete." }) }
  }, [toast])

  const openAddModal = useCallback(() => {
    setFirstName(""); setLastName(""); setAge(""); setJoiningDate(""); setSelectedCourseIds([])
    setIsAddOpen(true)
  }, [])

  const openEditModal = useCallback((s: Student) => {
    setCurrentId(s.id); setFirstName(s.first_name); setLastName(s.last_name)
    setAge(s.age.toString()); setJoiningDate(s.joining_date ? s.joining_date.split("T")[0] : "")
    setSelectedCourseIds(allCourses.filter(c => s.courses.includes(c.name)).map(c => c.id))
    setIsEditOpen(true)
  }, [allCourses])

  const toggleCourse = useCallback((id: number) =>
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  , [])

  const closeAll = useCallback(() => { setIsAddOpen(false); setIsEditOpen(false) }, [])

  const handleSaveNew = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true)
    try {
      await axios.post(`${API}/students/add`, { first_name: firstName, last_name: lastName, age, joining_date: joiningDate, course_ids: selectedCourseIds })
      toast({ title: "Success", description: "Student added!" }); setIsAddOpen(false); fetchStudents()
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to add student." }) }
    finally { setIsSaving(false) }
  }, [firstName, lastName, age, joiningDate, selectedCourseIds, toast])

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentId) return; setIsSaving(true)
    try {
      await axios.put(`${API}/students/${currentId}`, { first_name: firstName, last_name: lastName, age, joining_date: joiningDate, course_ids: selectedCourseIds })
      toast({ title: "Updated" }); setIsEditOpen(false); fetchStudents()
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to update." }) }
    finally { setIsSaving(false) }
  }, [currentId, firstName, lastName, age, joiningDate, selectedCourseIds, toast])

  const handleEnrollSave = useCallback(async (studentId: number, courseIds: number[]) => {
    setIsEnrollSaving(true)
    try {
      await axios.patch(`${API}/students/${studentId}/enrollment`, { course_ids: courseIds })
      toast({ title: "Enrollment Updated" })
      setEnrollStudent(null)
      fetchStudents()
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to update enrollment." }) }
    finally { setIsEnrollSaving(false) }
  }, [toast])

  const filteredStudents = useMemo(() =>
    students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  , [students, searchTerm])

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Student Directory</h1>
            <p className="text-muted-foreground">Manage student enrollments and profiles.</p>
          </div>
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />Add New Student
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Registered Students</CardTitle>
              <div className="relative w-full max-w-xs hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 sm:hidden relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" /><p>Loading...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg border-border/50">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No students found</h3>
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="h-12 px-4 align-middle">ID</th>
                      <th className="h-12 px-4 align-middle">Name</th>
                      <th className="h-12 px-4 align-middle hidden md:table-cell">Age</th>
                      <th className="h-12 px-4 align-middle hidden lg:table-cell">Joining Date</th>
                      <th className="h-12 px-4 align-middle">Courses</th>
                      <th className="h-12 px-4 align-middle">Enrollment</th>
                      <th className="h-12 px-4 align-middle text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="p-4 align-middle text-muted-foreground">#{student.id}</td>
                        <td className="p-4 align-middle font-medium">{student.first_name} {student.last_name}</td>
                        <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">{student.age}</td>
                        <td className="p-4 align-middle text-muted-foreground hidden lg:table-cell">
                          {student.joining_date ? format(new Date(student.joining_date), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {student.courses.length > 0
                              ? student.courses.map(c => <span key={c} className="inline-flex items-center rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium text-foreground border border-accent/40">{c}</span>)
                              : <span className="text-muted-foreground text-xs">None</span>}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs gap-1 ${student.status === "enrolled" ? "text-green-700 hover:text-green-800 hover:bg-green-50" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                            onClick={() => setEnrollStudent(student)}
                          >
                            {student.status === "enrolled"
                              ? <><UserCheck className="h-3.5 w-3.5" /> Enrolled</>
                              : <><UserMinus className="h-3.5 w-3.5" /> Unenrolled</>
                            }
                          </Button>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => openEditModal(student)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(student.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl bg-background border-border relative m-4 max-h-[90vh] overflow-y-auto">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 text-muted-foreground" onClick={closeAll}><X className="h-4 w-4" /></Button>
              <CardHeader><CardTitle>Add New Student</CardTitle></CardHeader>
              <CardContent>
                <ModalForm
                  firstName={firstName} onFirstName={setFirstName}
                  lastName={lastName} onLastName={setLastName}
                  age={age} onAge={setAge}
                  joiningDate={joiningDate} onJoiningDate={setJoiningDate}
                  allCourses={allCourses} selectedCourseIds={selectedCourseIds} onToggleCourse={toggleCourse}
                  onSubmit={handleSaveNew} onClose={closeAll}
                  isSaving={isSaving} submitLabel="Add Student"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl bg-background border-border relative m-4 max-h-[90vh] overflow-y-auto">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 text-muted-foreground" onClick={closeAll}><X className="h-4 w-4" /></Button>
              <CardHeader><CardTitle>Edit Student Details</CardTitle></CardHeader>
              <CardContent>
                <ModalForm
                  firstName={firstName} onFirstName={setFirstName}
                  lastName={lastName} onLastName={setLastName}
                  age={age} onAge={setAge}
                  joiningDate={joiningDate} onJoiningDate={setJoiningDate}
                  allCourses={allCourses} selectedCourseIds={selectedCourseIds} onToggleCourse={toggleCourse}
                  onSubmit={handleUpdate} onClose={closeAll}
                  isSaving={isSaving} submitLabel="Update Student"
                />
              </CardContent>
            </Card>
          </div>
        )}

        <EnrollModal
          student={enrollStudent}
          allCourses={allCourses}
          onClose={() => setEnrollStudent(null)}
          onSave={handleEnrollSave}
          isSaving={isEnrollSaving}
        />
      </div>
    </DashboardLayout>
  )
}
