import { $Enums, Prisma, Status } from "@prisma/client";

// Role enum definition
export enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

// You can also export it as a type for TypeScript usage
export type UserRole = keyof typeof Role


export type Code = {
  id: string;
  code: string;
  createdAt: Date;
  used: boolean;  
  companyId: string | null;


}


export type CodesResponse = {
  codes: Code[];
  nextCursor: string | null;
 
};


export type UserData = {
  tickets: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    title: string;
    description: string;
    status: $Enums.Status;
    priority: $Enums.Priority;
    category: string | null;
    createdById: string;
    assignedToId: string | null;
    notes: string | null;
    relatedSkills: string[];
  }[];
} | null;


 






export type AssignedTicket = {
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
}



 export type AllCompanyData = {
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
  _count: {
    tickets: number
    users: number
    codes: number
  }
  users: {
    id: string
    clerkId: string
    email: string
    firstname: string | null
    role: string
    skills: string[]
    createdAt: Date
    updatedAt: Date
    _count: {
      tickets: number
      assigned: number
    }
  }[]
  codes: {
    id: string
    code: string
    createdAt: Date
    used: boolean
    companyId: string | null
  }[]
}

 export type UserFilters = {
  role: string
  search: string
}

export type TicketFilters = {
  status: string
  priority: string
  category: string
  assignedTo: string
  createdBy: string
  search: string
}
  
