"use client"

import React, { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

const API = "http://127.0.0.1:5000"

export default function LoginPage() {
  const router    = useRouter()
  const { toast } = useToast()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [newName, setNewName]         = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSaving, setIsSaving]       = useState(false)

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.post(`${API}/login/admin`, {
        email:    email.trim(),
        password: password.trim(),
      })
      if (response.status === 200) {
        toast({ title: "Success", description: "Login successful!" })
        router.push("/dashboard")
      }
    } catch (error: any) {
      let msg = "Login failed. Please try again."
      if (error.response?.status === 401) msg = "Invalid username or password."
      else if (error.code === "ERR_NETWORK") msg = "Cannot connect to server. Is the backend running?"
      toast({ variant: "destructive", title: "Access Denied", description: msg })
    } finally { setIsLoading(false) }
  }, [email, password, router, toast])

  const handleRegisterSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await axios.post(`${API}/login/add`, { name: newName.trim(), password: newPassword.trim() })
      toast({ title: "User Created", description: "New staff member added successfully." })
      setIsRegisterOpen(false); setNewName(""); setNewPassword("")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.status === 409 ? "User already exists." : "Failed to create user." })
    } finally { setIsSaving(false) }
  }, [newName, newPassword, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      <Card className="w-full max-w-md shadow-2xl border-border/50 z-10">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-24 relative mb-4">
              <Image src="/images/whatsapp-20image-202025-12-18-20at-2012.jpeg" alt="Flipflop Digital Learning Logo" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-semibold text-center text-foreground mb-1">Flipflop Digital Learning</h1>
            <p className="text-sm text-muted-foreground">Attendance Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Username</Label>
              <Input id="email" type="text" placeholder="Enter username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Need to register a staff member?</p>
            <Button variant="outline" onClick={() => setIsRegisterOpen(true)} className="w-full border-primary/20 hover:bg-primary/5 text-primary">
              Add New User
            </Button>
          </div>
        </CardContent>
      </Card>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl bg-background border-border relative m-4">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 text-muted-foreground" onClick={() => setIsRegisterOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
            <CardHeader><CardTitle className="text-xl text-center">Add New User</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="New username" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
