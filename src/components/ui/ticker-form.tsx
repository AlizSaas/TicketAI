"use client"

import * as React from "react"
import { Send, Ticket, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {toast} from 'sonner'

interface TicketFormData {
  title: string
  description: string
}

export default function CreateTicketForm() {
  const [formData, setFormData] = React.useState<TicketFormData>({
    title: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [ticketId, setTicketId] = React.useState<string>("")
  

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.warning("Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call to create ticket
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a mock ticket ID
      const newTicketId = `TKT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      setTicketId(newTicketId)
      setIsSubmitted(true)

      toast.success('Ticket created successfully!')

      // Reset form after successful submission
      setFormData({ title: "", description: "" })
    } catch (error) {
      toast.error('Failed to create ticket. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAnother = () => {
    setIsSubmitted(false)
    setTicketId("")
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Ticket Created Successfully!</h2>
              <p className="mb-4 text-gray-600">
                Your support ticket has been submitted and assigned ID: <strong>{ticketId}</strong>
              </p>
              <div className="mb-6 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">What happens next?</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• AI will automatically categorize and prioritize your ticket</li>
                  <li>• The best available moderator will be assigned based on required skills</li>
                  <li>• You&apos;ll receive updates via email as your ticket progresses</li>
                  <li>• Expected response time: 2-4 hours during business hours</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleCreateAnother} variant="outline">
                  Create Another Ticket
                </Button>
                <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Ticket className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600">
            Describe your issue and our AI will automatically route it to the right team member
          </p>
        </div>

        <Card className="rounded-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Ticket Details
            </CardTitle>
            <CardDescription>
              Provide a clear title and detailed description of your issue. Our AI will handle categorization, priority
              assignment, and routing automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Ticket Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your issue (e.g., 'Unable to login to dashboard')"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="h-12 text-base"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">{formData.title.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue:
• What were you trying to do?
• What happened instead?
• Any error messages you saw?
• Steps to reproduce the problem?
• When did this start happening?"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-[150px] text-base resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500">{formData.description.length}/1000 characters</p>
              </div>

              <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  Automatic Processing
                </h3>
                <ul className="space-y-1 text-sm text-amber-700">
                  <li>
                    • <strong>Priority:</strong> AI will assess urgency based on your description
                  </li>
                  <li>
                    • <strong>Category:</strong> Automatically tagged based on content analysis
                  </li>
                  <li>
                    • <strong>Assignment:</strong> Routed to moderator with matching skills
                  </li>
                  <li>
                    • <strong>Status:</strong> Starts as &quot;Pending&quot; and updates automatically
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500">
                By submitting this ticket, you agree to our terms of service and privacy policy.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
