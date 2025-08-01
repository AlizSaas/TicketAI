"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { RadioGroup } from "@radix-ui/react-radio-group"
import { RadioGroupItem } from "./ui/radio-group"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { User, Shield, Crown } from "lucide-react"
import * as z from "zod"
import { createAdmin, createModerator, createUser } from "@/lib/onboardAction"

// Role enum
enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

// Form validation schemas
const userFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
  invitationCode: z
    .string()
    .min(6, "Invitation code must be 6 characters")
    .max(6, "Invitation code must be 6 characters"),
})

const moderatorFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
  invitationCode: z
    .string()
    .min(6, "Invitation code must be 6 characters")
    .max(6, "Invitation code must be 6 characters"),
})

const adminFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
  companyName: z.string().min(1, "Company name is required"),
  
})

type UserFormValues = z.infer<typeof userFormSchema>
type ModeratorFormValues = z.infer<typeof moderatorFormSchema>
type AdminFormValues = z.infer<typeof adminFormSchema>

interface OnboardingFormProps {
  userEmail: string
  firstName: string
}

// Placeholder action functions - replace with your actual implementations





const OnboardingForm = ({ userEmail, firstName }: OnboardingFormProps) => {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [selectedRole, setSelectedRole] = useState<Role>(Role.USER)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName,
      email: userEmail,
      invitationCode: "",
    },
  })

  const moderatorForm = useForm<ModeratorFormValues>({
    resolver: zodResolver(moderatorFormSchema),
    defaultValues: {
      firstName: firstName || "",
      email: userEmail,
      invitationCode: "",
    },
  })

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      firstName: firstName || "",
      email: userEmail,
      companyName: "",
  
    },
  })

  const handleUserSubmit = async (data: UserFormValues) => {
    if (!user) return
    setError(null)
    setIsSubmitting(true)

    const { error, success } = await createUser(user.id, data.invitationCode)

    if (!success) {
      setError(error ?? "Something went wrong.")
      toast.error(error ?? "Failed to join company. Please try again.")
      setIsSubmitting(false)
      return
    }

    toast.success("Successfully joined company!")
    try {
      await user.reload()
    } catch (err) {
      console.error("Failed to reload user:", err)
    }
    router.push("/dashboard")
  }

  const handleModeratorSubmit = async (data: ModeratorFormValues) => {
    if (!user) return
    setError(null)
    setIsSubmitting(true)

    const { error, success } = await createModerator(user.id, data.invitationCode)

    if (!success) {
      setError(error ?? "Something went wrong.")
      toast.error(error ?? "Failed to join company. Please try again.")
      setIsSubmitting(false)
      return
    }

    toast.success("Successfully joined company as moderator!")
    try {
      await user.reload()
    } catch (err) {
      console.error("Failed to reload user:", err)
    }
    router.push("/moderator")
  }

  const handleAdminSubmit = async (data: AdminFormValues) => {
    if (!user) return
    setError(null)
    setIsSubmitting(true)

    const { error, success } = await createAdmin(user.id, data.companyName)

    if (!success) {
      setError(error ?? "Something went wrong.")
      toast.error(error ?? "Failed to create company. Please try again.")
      setIsSubmitting(false)
      return
    }

    toast.success("Company created successfully!")
    try {
      await user.reload()
    } catch (err) {
      console.error("Failed to reload user:", err)
    }
    router.push("/admin")
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  const roleOptions = [
    {
      value: Role.USER,
      icon: User,
      title: "User",
      description: "Join a company to request bikes",
    },
    {
      value: Role.MODERATOR,
      icon: Shield,
      title: "Moderator",
      description: "Join a company with moderation privileges",
    },
    {
      value: Role.ADMIN,
      icon: Crown,
      title: "Admin",
      description: "Create and manage companies",
    },
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Complete your account setup</CardTitle>
        <CardDescription>Welcome to BikeRequest! Let&apos;s get you onboarded.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Account Role</Label>
            <RadioGroup
              defaultValue={Role.USER}
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {roleOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                    <Label
                      htmlFor={option.value}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-all duration-200 cursor-pointer",
                        "hover:border-gray-300 hover:bg-gray-50",
                        selectedRole === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm"
                          : "border-gray-200 bg-white",
                      )}
                    >
                      <IconComponent className="w-8 h-8 mb-2" />
                      <span className="text-lg font-medium">{option.title}</span>
                      <span className="text-sm text-gray-500 text-center mt-1">{option.description}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          <Separator />

          {selectedRole === Role.USER && (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Access</h3>
                  <FormField
                    control={userForm.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the 6-digit code"
                            maxLength={6}
                            className="text-center text-lg tracking-widest font-mono"
                          />
                        </FormControl>
                        <FormDescription>Enter the 6-digit invitation code provided by your company.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Join Company"}
                </Button>
              </form>
            </Form>
          )}

          {selectedRole === Role.MODERATOR && (
            <Form {...moderatorForm}>
              <form onSubmit={moderatorForm.handleSubmit(handleModeratorSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={moderatorForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={moderatorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Access</h3>
                  <FormField
                    control={moderatorForm.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the 6-digit code"
                            maxLength={6}
                            className="text-center text-lg tracking-widest font-mono"
                          />
                        </FormControl>
                        <FormDescription>Enter the 6-digit invitation code provided by your company.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Join Company as Moderator"}
                </Button>
              </form>
            </Form>
          )}

          {selectedRole === Role.ADMIN && (
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-gray-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Create Company</h3>
                  <div className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your company name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                   
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Company..." : "Create Company"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OnboardingForm
