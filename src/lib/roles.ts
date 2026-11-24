export type AppRole = "USER" | "MODERATOR" | "ADMIN"

export function getRoleHome(role?: string | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin"
    case "MODERATOR":
      return "/moderator"
    default:
      return "/dashboard"
  }
}
