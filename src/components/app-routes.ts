import { RoleEnum } from "@/enums/role.enum";

export const PageSlugs = {
  login: "login",
  dashboard: "dashboard",
  bedBoard: "bed-board",
  setup: "setup",
  tenants: "tenants",
  rentDues: "rent-dues",
  complaints: "complaints",
  announcements: "announcements",
  staff: "staff",
  reports: "reports",
  auditLog: "audit-log",
  notifications: "notifications",
  tenantHome: "home",
  tenantRent: "rent",
  tenantHelp: "help",
  tenantAlerts: "alerts",
  tenantProfile: "profile",
} as const;

export const AppRoutes = {
  Login: `/${PageSlugs.login}`,
  Dashboard: `/${PageSlugs.dashboard}`,
  BedBoard: `/${PageSlugs.bedBoard}`,
  Setup: `/${PageSlugs.setup}`,
  Tenants: `/${PageSlugs.tenants}`,
  RentDues: `/${PageSlugs.rentDues}`,
  Complaints: `/${PageSlugs.complaints}`,
  Announcements: `/${PageSlugs.announcements}`,
  Staff: `/${PageSlugs.staff}`,
  Reports: `/${PageSlugs.reports}`,
  AuditLog: `/${PageSlugs.auditLog}`,
  Notifications: `/${PageSlugs.notifications}`,
  TenantHome: `/tenant/${PageSlugs.tenantHome}`,
  TenantRent: `/tenant/${PageSlugs.tenantRent}`,
  TenantHelp: `/tenant/${PageSlugs.tenantHelp}`,
  TenantAlerts: `/tenant/${PageSlugs.tenantAlerts}`,
  TenantProfile: `/tenant/${PageSlugs.tenantProfile}`,
} as const;

export const ownerRoutes: string[] = [
  AppRoutes.Setup,
  AppRoutes.Announcements,
  AppRoutes.Staff,
  AppRoutes.Reports,
  AppRoutes.AuditLog,
];

export const propertyFilterRoutes: string[] = [
  AppRoutes.Dashboard,
  AppRoutes.BedBoard,
  AppRoutes.Tenants,
  AppRoutes.RentDues,
];

export function routeForNotification(role: RoleEnum, link: string) {
  if (role === RoleEnum.tenant) {
    if (link === "rent") return AppRoutes.TenantRent;
    if (link === "help" || link === "complaints") return AppRoutes.TenantHelp;
    return AppRoutes.TenantHome;
  }
  if (link === "complaints") return AppRoutes.Complaints;
  if (link === "dues" || link === "rent") return AppRoutes.RentDues;
  if (link === "tenants") return AppRoutes.Tenants;
  return AppRoutes.Dashboard;
}
