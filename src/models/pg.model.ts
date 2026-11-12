import type {
  BedStyleEnum,
  ComplaintStatusEnum,
  DepositKindEnum,
  PaymentStatusEnum,
  TenantStatusEnum,
} from "@/enums/pg.enum";
import type { RoleEnum } from "@/enums/role.enum";

export interface FloorModel {
  key: string;
  label: string;
}

export interface PropertyModel {
  id: string;
  name: string;
  area: string;
  bedStyle: BedStyleEnum;
  floors: FloorModel[];
}

export interface RoomModel {
  id: string;
  propertyId: string;
  label: string;
  floorKey: string;
  type: string;
  rent: number;
  archived: boolean;
}

export interface BedModel {
  id: string;
  roomId: string;
  label: string;
  rentOverride: number | null;
  outOfService: boolean;
}

export interface TenantHistoryModel {
  date: string;
  text: string;
}

export interface TenantModel {
  id: string;
  name: string;
  phone: string;
  email: string;
  bedId: string | null;
  lastBedId?: string;
  rent: number;
  deposit: number;
  start: string;
  dueDay: number;
  status: TenantStatusEnum;
  credit: number;
  vacate?: string;
  history: TenantHistoryModel[];
}

export interface UserModel {
  id: string;
  email: string;
  password: string;
  name: string;
  role: RoleEnum;
  propertyId?: string;
  tenantId?: string;
}

export interface ChargeModel {
  id: string;
  tenantId: string;
  type: string;
  month: string;
  amount: number;
  due: string;
}

export interface PaymentAllocationModel {
  chargeId: string;
  amount: number;
}

export interface PaymentModel {
  id: string;
  tenantId: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
  status: PaymentStatusEnum;
  by: string;
  receiptNo: string;
  allocations: PaymentAllocationModel[];
}

export interface DepositModel {
  id: string;
  tenantId: string;
  kind: DepositKindEnum;
  amount: number;
  note: string;
  date: string;
}

export interface ComplaintEventModel {
  at: string;
  text: string;
}

export interface ComplaintMessageModel {
  by: string;
  role: RoleEnum;
  text: string;
  at: string;
}

export interface ComplaintModel {
  id: string;
  tenantId: string;
  category: string;
  title: string;
  description: string;
  photos: string[];
  urgent: boolean;
  isPrivate: boolean;
  status: ComplaintStatusEnum;
  assignee: string;
  created: string;
  events: ComplaintEventModel[];
  messages: ComplaintMessageModel[];
}

export interface NotificationModel {
  id: string;
  to: string;
  text: string;
  link: string;
  read: boolean;
  at: string;
}

export interface AnnouncementModel {
  id: string;
  title: string;
  body: string;
  date: string;
}

export interface AuditModel {
  at: string;
  by: string;
  text: string;
}

export interface SettingsModel {
  staffPay: boolean;
  staffPrivate: boolean;
  upi: string;
}

export interface PgDatabase {
  seq: number;
  properties: PropertyModel[];
  rooms: RoomModel[];
  beds: BedModel[];
  tenants: TenantModel[];
  users: UserModel[];
  charges: ChargeModel[];
  payments: PaymentModel[];
  deposits: DepositModel[];
  complaints: ComplaintModel[];
  notifications: NotificationModel[];
  announcements: AnnouncementModel[];
  audit: AuditModel[];
  settings: SettingsModel;
  receiptCounter: number;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface LoginResultModel {
  userId: string;
  name: string;
  role: RoleEnum;
}

export interface CheckInInput {
  name: string;
  phone: string;
  email: string;
  bedId: string;
  start: string;
  dueDay: number;
  rent: number;
  deposit: number;
  depositCollected: boolean;
}

export interface CheckInResultModel {
  tenantId: string;
  name: string;
  email: string;
  bedLabel: string;
  firstRent: number;
}

export interface RecordPaymentInput {
  tenantId: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
}

export interface CheckoutInput {
  tenantId: string;
  deduction: number;
  reason: string;
  lastDay: string;
}

export interface TransferInput {
  tenantId: string;
  bedId: string;
  date: string;
  updateRent: boolean;
}

export interface NoticeInput {
  tenantId: string;
  lastDay: string;
}

export interface AdjustInput {
  tenantId: string;
  kind: "charge" | "discount";
  amount: number;
  note: string;
}

export interface ComplaintInput {
  category: string;
  title: string;
  description: string;
  photos: string[];
  isPrivate: boolean;
  urgent: boolean;
}

export interface ComplaintUpdateInput {
  complaintId: string;
  status: ComplaintStatusEnum;
  assignee: string;
}

export interface StaffInput {
  name: string;
  email: string;
  propertyId: string;
}

export interface PropertyInput {
  name: string;
  area: string;
  bedStyle: BedStyleEnum;
}

export interface FloorInput {
  number: number;
  label: string;
}

export interface RoomInput {
  label: string;
  floorKey: string;
  beds: number;
  rent: number;
  type: string;
}

export interface RoomUpdateInput {
  roomId: string;
  label: string;
  floorKey: string;
  rent: number;
  type: string;
  bedRents: { id: string; rentOverride: number | null }[];
}

export interface BulkRoomsInput {
  firstFloor: number;
  floors: number;
  roomsPerFloor: number;
  bedsPerRoom: number;
  rent: number;
  type: string;
  numbering: "floor2" | "seq" | "dash";
}

export interface EmptyPgInput {
  name: string;
  email: string;
  password: string;
  pgName: string;
  area: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
}
