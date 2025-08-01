"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, Clock, CheckCircle, XCircle, Loader2, Plus, Eye, TrendingUp, AlertCircle, Filter } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import * as z from "zod"
import { useCreateTicket } from "../moderator/use-mutation"
import kyInstance from "@/lib/ky"
import { useQuery } from "@tanstack/react-query"
import CustomersTableSkeleton from "@/components/cus-ske"
import type { $Enums } from "@prisma/client"


// Types for user data and tickets
type Status = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

type UserData = {
  tickets: {
    id: string
    createdAt: Date
    updatedAt: Date
    companyId: string
    title: string
    description: string
    status: $Enums.Status
    priority: $Enums.Priority
    category: string | null
    createdById: string
    createdByName: string | null
    createdByEmail: string | null
    createdByRole: $Enums.Role
    assignedToId: string | null
    assignedToName: string | null
    assignedToEmail: string | null
    assignedToRole: $Enums.Role
    notes: string | null
    relatedSkills: string[]
  }[]
} | null

export type UserTicket = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  category: string | null
  createdAt: Date
  updatedAt: Date
  assignedToId: string | null
  assignedToName: string | null
  resolutionNote?: string
  rejectionReason?: string
}

// Form validation schema
const ticketFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
})

export type TicketFormValues = z.infer<typeof ticketFormSchema>

export default function UserDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")


  const {
    data,
    error,
    isPending: isPendingData,
    refetch,
  } = useQuery({
    queryKey: ["userData"],
    queryFn: () => {
      return kyInstance.get("/api/user").json<UserData>()
    },
  })

  const { mutate, isPending } = useCreateTicket()
  
   useEffect(() => {
    const intervalId = setInterval(() => {
      refetch()
    }, 30000) // 30 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [refetch])

  // Derive userTickets from userData prop
  const userTickets: UserTicket[] = useMemo(() => {
    if (!data) return []
    return data.tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      assignedToId: ticket.assignedToId,
      assignedToName: ticket.assignedToName,
      resolutionNote: ticket.status === "RESOLVED" ? (ticket.notes ?? undefined) : undefined,
      rejectionReason: ticket.status === "REJECTED" ? (ticket.notes ?? undefined) : undefined,
    }))
  }, [data]) // Memoize to avoid unnecessary recalculations
 
 

  // Start polling when a new ticket is created

  // Filter tickets based on status
  const filteredTickets = useMemo(() => {
    if (statusFilter === "ALL") return userTickets
    return userTickets.filter((ticket) => ticket.status === statusFilter) // Filter tickets by status
  }, [userTickets, statusFilter]) // Memoize to avoid unnecessary recalculations

  // Calculate userStats dynamically
  const userStats = useMemo(() => {
    const totalTickets = userTickets.length
    const pendingTickets = userTickets.filter((t) => t.status === "PENDING").length
    const resolvedTickets = userTickets.filter((t) => t.status === "RESOLVED").length
    const rejectedTickets = userTickets.filter((t) => t.status === "REJECTED").length
    return {
      totalTickets,
      pendingTickets,
      resolvedTickets,
      rejectedTickets,
    }
  }, [userTickets])

 

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  if (isPendingData) {
    return <CustomersTableSkeleton />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        )
      case "RESOLVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: Priority) => {
    const variants = {
      LOW: "text-gray-600 border-gray-600",
      MEDIUM: "text-blue-600 border-blue-600",
      HIGH: "text-orange-600 border-orange-600",
      URGENT: "text-red-600 border-red-600",
    }
    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority}
      </Badge>
    )
  }

  const handleSubmitTicket = async (data: TicketFormValues) => {
    try {
      mutate(data)
      toast.success("Ticket submitted successfully! You'll be notified when it's assigned.")
      setIsCreateModalOpen(false)
      form.reset()
    } catch (error) {
      console.error("Failed to submit ticket:", error)
      toast.error("Failed to submit ticket. Please try again.")
    }
  }

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case "ALL":
        return "All Tickets"
      case "PENDING":
        return "Pending"
      case "IN_PROGRESS":
        return "In Progress"
      case "RESOLVED":
        return "Resolved"
      case "REJECTED":
        return "Rejected"
      default:
        return "All Tickets"
    }
  } //

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-2">Submit requests and track their progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalTickets}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.pendingTickets}</div>
              <p className="text-xs text-gray-500 mt-1">Waiting for assignment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.resolvedTickets}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.totalTickets > 0
                  ? Math.round((userStats.resolvedTickets / userStats.totalTickets) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-gray-500 mt-1">Resolution rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Ticket Button and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Submit New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit New Ticket</DialogTitle>
                <DialogDescription>
                  Describe your request or issue. Our team will review and assign it to the appropriate person.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitTicket)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of your request..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide detailed information about your request or issue..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Ticket"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tickets</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Tickets</span>
              <Badge variant="outline" className="text-sm">
                {filteredTickets.length} of {userTickets.length} tickets
              </Badge>
            </CardTitle>
            <CardDescription>
              {statusFilter === "ALL"
                ? "Track the status of your submitted requests"
                : `Showing ${getFilterLabel(statusFilter).toLowerCase()} tickets`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{ticket.description}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell>
                        {ticket.assignedToId ? (
                          <Badge variant="outline" className="text-blue-500 border-blue-500">
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not assigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                {statusFilter === "ALL" ? (
                  <>
                    <p className="text-gray-500 mb-2">No tickets submitted yet</p>
                    <p className="text-sm text-gray-400 mb-4">Submit your first ticket to get started</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit New Ticket
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-2">No {getFilterLabel(statusFilter).toLowerCase()} tickets found</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Try selecting a different filter or submit a new ticket
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setStatusFilter("ALL")}>
                        Show All Tickets
                      </Button>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Ticket
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ticket Details
                </DialogTitle>
                <DialogDescription>View your ticket information and status</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      {selectedTicket.category && <Badge variant="outline">{selectedTicket.category}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Submitted on</Label>
                      <div className="font-medium">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(selectedTicket.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Last updated</Label>
                      <div className="font-medium">{new Date(selectedTicket.updatedAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(selectedTicket.updatedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Description</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{selectedTicket.description}</div>
                  </div>
                  {selectedTicket.assignedToId && (
                    <div>
                      <Label className="text-gray-600">Assigned to</Label>
                      <div className="mt-1 p-3 bg-blue-50 rounded-md">
                        <div className="text-sm text-gray-600">Name: {selectedTicket.assignedToName}</div>
                      </div>
                    </div>
                  )}
                  {selectedTicket.resolutionNote && (
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Resolution
                      </Label>
                      <div className="mt-1 p-3 bg-green-50 rounded-md text-sm border border-green-200">
                        {selectedTicket.resolutionNote}
                      </div>
                    </div>
                  )}
                  {selectedTicket.rejectionReason && (
                    <div>
                      <Label className="text-gray-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Rejection Reason
                      </Label>
                      <div className="mt-1 p-3 bg-red-50 rounded-md text-sm border border-red-200">
                        {selectedTicket.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
