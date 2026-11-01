import {
  ComplaintStatusEnum,
  DepositKindEnum,
  DuesToneEnum,
  PaymentStatusEnum,
  TenantStatusEnum,
} from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import {
  addDays,
  DEMO_TODAY,
  dayDiff,
  formatDayMonth,
  formatInr,
  monthLabel,
  nextMonth,
  nowLabel,
  parseIso,
  toIso,
} from "@/lib/constants";
import { seedEmpty } from "@/lib/seed";
import type {
  ActionResult,
  AdjustInput,
  AnnouncementInput,
  BedModel,
  BulkRoomsInput,
  ChargeModel,
  CheckInInput,
  CheckInResultModel,
  CheckoutInput,
  ComplaintInput,
  ComplaintModel,
  ComplaintUpdateInput,
  EmptyPgInput,
  FloorInput,
  LoginResultModel,
  NoticeInput,
  PaymentModel,
  PgDatabase,
  PropertyInput,
  PropertyModel,
  RecordPaymentInput,
  RoomInput,
  RoomModel,
  RoomUpdateInput,
  StaffInput,
  TenantModel,
  TransferInput,
  UserModel,
} from "@/models/pg.model";

export interface BedDetails {
  full: string;
  propertyName: string;
  area: string;
  propertyId: string;
  room: RoomModel | null;
}

export interface DuesStatus {
  tone: DuesToneEnum;
  text: string;
  amount: number;
  days: number;
}

type Permission =
  | "pay"
  | "confirm"
  | "checkin"
  | "notice"
  | "transfer"
  | "complaints";

const fail = <T>(error: string): ActionResult<T> => ({ ok: false, error });
const done = <T>(data: T, message?: string): ActionResult<T> => ({
  ok: true,
  data,
  message,
});

export function nextId(db: PgDatabase, prefix: string) {
  db.seq += 1;
  return `${prefix}${db.seq}`;
}

export function userById(db: PgDatabase, id: string | null | undefined) {
  if (!id) return undefined;
  return db.users.find((user) => user.id === id);
}

export function tenantById(db: PgDatabase, id: string | null | undefined) {
  if (!id) return undefined;
  return db.tenants.find((tenant) => tenant.id === id);
}

export function roomById(db: PgDatabase, id: string | null | undefined) {
  if (!id) return undefined;
  return db.rooms.find((room) => room.id === id);
}

export function bedById(db: PgDatabase, id: string | null | undefined) {
  if (!id) return undefined;
  return db.beds.find((bed) => bed.id === id);
}

export function propertyById(db: PgDatabase, id: string | null | undefined) {
  if (!id) return undefined;
  return db.properties.find((property) => property.id === id);
}

export function audienceKey(user: UserModel) {
  return user.role === RoleEnum.tenant ? `t:${user.tenantId ?? ""}` : user.role;
}

export function pushAudit(db: PgDatabase, by: string, text: string) {
  db.audit.unshift({ at: nowLabel(), by, text });
}

export function pushNotification(
  db: PgDatabase,
  to: string | string[],
  text: string,
  link = "",
) {
  for (const target of Array.isArray(to) ? to : [to]) {
    db.notifications.unshift({
      id: nextId(db, "n"),
      to: target,
      text,
      link,
      read: false,
      at: nowLabel(),
    });
  }
}

export function actorName(db: PgDatabase, uid: string | null) {
  return userById(db, uid)?.name ?? "System";
}

export function bedRent(db: PgDatabase, bed: BedModel) {
  if (bed.rentOverride && bed.rentOverride > 0) return bed.rentOverride;
  return roomById(db, bed.roomId)?.rent ?? 0;
}

export function isLiveBed(db: PgDatabase, bed: BedModel) {
  const room = roomById(db, bed.roomId);
  return !bed.outOfService && !!room && !room.archived;
}

export function bedsInRoom(db: PgDatabase, roomId: string) {
  return db.beds.filter((bed) => bed.roomId === roomId);
}

export function occupant(db: PgDatabase, bedId: string) {
  return db.tenants.find(
    (tenant) =>
      tenant.bedId === bedId && tenant.status !== TenantStatusEnum.ended,
  );
}

export function bedInfo(
  db: PgDatabase,
  bedId: string | null | undefined,
): BedDetails {
  const bed = bedById(db, bedId);
  if (!bed) {
    return {
      full: "—",
      propertyName: "—",
      area: "",
      propertyId: "",
      room: null,
    };
  }
  const room = roomById(db, bed.roomId);
  const property = propertyById(db, room?.propertyId);
  return {
    full: room ? `${room.label} · ${bed.label}` : bed.label,
    propertyName: property?.name ?? "—",
    area: property?.area ?? "",
    propertyId: property?.id ?? "",
    room: room ?? null,
  };
}

export function inScope(
  db: PgDatabase,
  tenant: TenantModel | undefined,
  propertyId: string,
) {
  if (!tenant) return false;
  if (!tenant.bedId) return propertyId === "all";
  return (
    propertyId === "all" || bedInfo(db, tenant.bedId).propertyId === propertyId
  );
}

export function scopeBeds(db: PgDatabase, propertyId: string) {
  return db.beds.filter(
    (bed) =>
      isLiveBed(db, bed) &&
      (propertyId === "all" ||
        roomById(db, bed.roomId)?.propertyId === propertyId),
  );
}

export function liveTenants(db: PgDatabase, propertyId: string) {
  return db.tenants.filter(
    (tenant) =>
      tenant.status !== TenantStatusEnum.ended &&
      inScope(db, tenant, propertyId),
  );
}

export function chargesOf(db: PgDatabase, tenantId: string) {
  return db.charges.filter((charge) => charge.tenantId === tenantId);
}

export function paidOn(db: PgDatabase, chargeId: string) {
  let total = 0;
  for (const payment of db.payments) {
    if (payment.status !== PaymentStatusEnum.confirmed) continue;
    for (const allocation of payment.allocations) {
      if (allocation.chargeId === chargeId) total += allocation.amount;
    }
  }
  return total;
}

export function balance(db: PgDatabase, charge: ChargeModel) {
  return charge.amount - paidOn(db, charge.id);
}

export function openCharges(db: PgDatabase, tenant: TenantModel) {
  return chargesOf(db, tenant.id)
    .filter((charge) => balance(db, charge) > 0)
    .sort((a, b) => (a.due < b.due ? -1 : 1));
}

export function owed(db: PgDatabase, tenant: TenantModel) {
  return openCharges(db, tenant).reduce(
    (sum, charge) => sum + balance(db, charge),
    0,
  );
}

export function duesStatus(db: PgDatabase, tenant: TenantModel): DuesStatus {
  if (tenant.status === TenantStatusEnum.ended) {
    return {
      tone: DuesToneEnum.gy,
      text: "Checked out",
      amount: 0,
      days: -999,
    };
  }
  const open = openCharges(db, tenant);
  if (!open.length)
    return { tone: DuesToneEnum.paid, text: "Paid", amount: 0, days: -999 };
  const first = open[0];
  if (!first)
    return { tone: DuesToneEnum.paid, text: "Paid", amount: 0, days: -999 };
  const days = dayDiff(first.due, DEMO_TODAY);
  const paid = paidOn(db, first.id);
  const amount = open.reduce((sum, charge) => sum + balance(db, charge), 0);
  if (days > 0) {
    return paid > 0
      ? {
          tone: DuesToneEnum.part,
          text: `Partial · ${formatInr(paid)} paid`,
          amount,
          days,
        }
      : {
          tone: DuesToneEnum.late,
          text: `${days} day${days > 1 ? "s" : ""} late`,
          amount,
          days,
        };
  }
  if (days >= -5) {
    return {
      tone: DuesToneEnum.soon,
      text:
        days === 0 ? "Due today" : `Due in ${-days} day${days < -1 ? "s" : ""}`,
      amount,
      days,
    };
  }
  return {
    tone: DuesToneEnum.soon,
    text: `Due ${formatDayMonth(first.due)}`,
    amount,
    days,
  };
}

export function depositBalance(db: PgDatabase, tenantId: string) {
  return db.deposits
    .filter((deposit) => deposit.tenantId === tenantId)
    .reduce(
      (sum, deposit) =>
        sum +
        (deposit.kind === DepositKindEnum.collected
          ? deposit.amount
          : -deposit.amount),
      0,
    );
}

export function allocate(db: PgDatabase, tenant: TenantModel, amount: number) {
  let left = amount;
  const allocations: PaymentModel["allocations"] = [];
  for (const charge of openCharges(db, tenant)) {
    if (left <= 0) break;
    const share = Math.min(left, balance(db, charge));
    allocations.push({ chargeId: charge.id, amount: share });
    left -= share;
  }
  return { allocations, credit: left };
}

export function can(
  db: PgDatabase,
  user: UserModel | undefined,
  action: Permission,
) {
  if (!user) return false;
  if (user.role === RoleEnum.owner) return true;
  if (user.role !== RoleEnum.staff) return false;
  if (action === "pay" || action === "confirm") return db.settings.staffPay;
  return (
    action === "checkin" ||
    action === "notice" ||
    action === "transfer" ||
    action === "complaints"
  );
}

export function dueList(
  db: PgDatabase,
  propertyId: string,
  filter: string,
  query = "",
) {
  let list = liveTenants(db, propertyId);
  if (
    filter === "late" ||
    filter === "part" ||
    filter === "soon" ||
    filter === "paid"
  ) {
    list = list.filter((tenant) => duesStatus(db, tenant).tone === filter);
  } else if (filter !== "all") {
    list = list.filter(
      (tenant) => duesStatus(db, tenant).tone !== DuesToneEnum.paid,
    );
  }
  const needle = query.trim().toLowerCase();
  if (needle) {
    list = list.filter((tenant) =>
      `${tenant.name} ${bedInfo(db, tenant.bedId).full}`
        .toLowerCase()
        .includes(needle),
    );
  }
  return list.sort((a, b) => duesStatus(db, b).days - duesStatus(db, a).days);
}

export function visibleComplaints(db: PgDatabase, user: UserModel | undefined) {
  return db.complaints
    .filter((complaint) => {
      if (!user) return false;
      if (user.role === RoleEnum.tenant)
        return complaint.tenantId === user.tenantId;
      if (
        user.role === RoleEnum.staff &&
        complaint.isPrivate &&
        !db.settings.staffPrivate
      )
        return false;
      return true;
    })
    .sort((a, b) => (a.created < b.created ? 1 : -1));
}

export function openComplaintCount(
  db: PgDatabase,
  user: UserModel | undefined,
) {
  return visibleComplaints(db, user).filter(
    (complaint) =>
      complaint.status !== ComplaintStatusEnum.Closed &&
      complaint.status !== ComplaintStatusEnum.Resolved,
  ).length;
}

export function pendingPayments(db: PgDatabase, propertyId = "all") {
  return db.payments.filter(
    (payment) =>
      payment.status === PaymentStatusEnum.pending &&
      inScope(db, tenantById(db, payment.tenantId), propertyId),
  );
}

export function unreadCount(db: PgDatabase, user: UserModel | undefined) {
  if (!user) return 0;
  const key = audienceKey(user);
  return db.notifications.filter((item) => item.to === key && !item.read)
    .length;
}

export function myNotifications(db: PgDatabase, user: UserModel | undefined) {
  if (!user) return [];
  const key = audienceKey(user);
  return db.notifications.filter((item) => item.to === key);
}

export function floorName(property: PropertyModel, key: string) {
  return (
    property.floors.find((floor) => floor.key === key)?.label ??
    (key === "0" ? "Ground floor" : `Floor ${key}`)
  );
}

export function sortedFloors(db: PgDatabase, property: PropertyModel) {
  const floors = [...property.floors];
  for (const room of db.rooms) {
    if (
      room.propertyId === property.id &&
      !floors.some((floor) => floor.key === room.floorKey)
    ) {
      floors.push({
        key: room.floorKey,
        label: floorName(property, room.floorKey),
      });
    }
  }
  return floors.sort((a, b) => {
    const left = Number(a.key);
    const right = Number(b.key);
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return left - right;
  });
}

export function roomsOnFloor(
  db: PgDatabase,
  propertyId: string,
  floorKey: string,
) {
  return db.rooms.filter(
    (room) => room.propertyId === propertyId && room.floorKey === floorKey,
  );
}

export function propertyRooms(db: PgDatabase, propertyId: string) {
  return db.rooms.filter((room) => room.propertyId === propertyId);
}

function ensureFloor(property: PropertyModel, key: string, label?: string) {
  if (!property.floors.some((floor) => floor.key === key)) {
    property.floors.push({
      key,
      label: label || (key === "0" ? "Ground floor" : `Floor ${key}`),
    });
  }
}

function bedLabelAt(property: PropertyModel, index: number) {
  if (property.bedStyle === "num") return String(index + 1);
  const suffix = index >= 26 ? Math.floor(index / 26) : "";
  return `${String.fromCharCode(65 + (index % 26))}${suffix}`;
}

function nextBedLabel(
  db: PgDatabase,
  property: PropertyModel,
  room: RoomModel,
) {
  const used = bedsInRoom(db, room.id).map((bed) => bed.label);
  let index = 0;
  let label = bedLabelAt(property, index);
  while (used.includes(label)) {
    index += 1;
    label = bedLabelAt(property, index);
  }
  return label;
}

function makeRoom(
  db: PgDatabase,
  property: PropertyModel,
  label: string,
  floorKey: string,
  bedCount: number,
  rent: number,
  type: string,
) {
  const room: RoomModel = {
    id: nextId(db, "r"),
    propertyId: property.id,
    label,
    floorKey,
    rent,
    type,
    archived: false,
  };
  db.rooms.push(room);
  for (let index = 0; index < bedCount; index += 1) {
    db.beds.push({
      id: nextId(db, "b"),
      roomId: room.id,
      label: bedLabelAt(property, index),
      rentOverride: null,
      outOfService: false,
    });
  }
  return room;
}

export function vacantBeds(db: PgDatabase, excludeId?: string) {
  return db.beds.filter(
    (bed) =>
      isLiveBed(db, bed) && !occupant(db, bed.id) && bed.id !== excludeId,
  );
}

export function suggestRoomLabel(
  db: PgDatabase,
  property: PropertyModel,
  floorKey: string,
) {
  let count = roomsOnFloor(db, property.id, floorKey).length + 1;
  let label = "";
  do {
    label =
      floorKey === "0"
        ? `G${String(count).padStart(2, "0")}`
        : Number.isNaN(Number(floorKey))
          ? String(count)
          : String(Number(floorKey) * 100 + count);
    count += 1;
  } while (
    propertyRooms(db, property.id).some(
      (room) => room.label.toLowerCase() === label.toLowerCase(),
    )
  );
  return label;
}

export function activeSetupProperty(
  db: PgDatabase,
  setupPropertyId: string | null,
) {
  return (
    db.properties.find((property) => property.id === setupPropertyId) ??
    db.properties[0]
  );
}

function applyCredit(db: PgDatabase, tenant: TenantModel) {
  if (tenant.credit <= 0) return;
  const outstanding = owed(db, tenant);
  if (outstanding <= 0) return;
  const amount = Math.min(tenant.credit, outstanding);
  const split = allocate(db, tenant, amount);
  tenant.credit -= amount;
  db.payments.unshift({
    id: nextId(db, "pay"),
    tenantId: tenant.id,
    amount,
    method: "Credit",
    reference: "Advance adjusted",
    date: DEMO_TODAY,
    status: PaymentStatusEnum.confirmed,
    by: "System",
    receiptNo: "",
    allocations: split.allocations,
  });
}

function addConfirmedPayment(
  db: PgDatabase,
  tenant: TenantModel,
  input: {
    amount: number;
    method: string;
    reference: string;
    date: string;
    by: string;
    status?: PaymentStatusEnum;
  },
) {
  const payment: PaymentModel = {
    id: nextId(db, "pay"),
    tenantId: tenant.id,
    amount: input.amount,
    method: input.method,
    reference: input.reference,
    date: input.date || DEMO_TODAY,
    status: input.status ?? PaymentStatusEnum.confirmed,
    by: input.by,
    receiptNo: "",
    allocations: [],
  };
  if (payment.status === PaymentStatusEnum.confirmed) {
    const split = allocate(db, tenant, payment.amount);
    payment.allocations = split.allocations;
    tenant.credit += split.credit;
    if (!["Deposit", "Discount", "Credit"].includes(input.method)) {
      db.receiptCounter += 1;
      payment.receiptNo = `RC-${String(db.receiptCounter).padStart(5, "0")}`;
    }
  }
  db.payments.unshift(payment);
  return payment;
}

export function signIn(
  db: PgDatabase,
  email: string,
  password: string,
): ActionResult<LoginResultModel> {
  const user = db.users.find(
    (item) =>
      item.email.toLowerCase() === email.trim().toLowerCase() &&
      item.password === password,
  );
  if (!user)
    return fail("Wrong email or password. Try the demo buttons above.");
  pushAudit(db, user.name, "Signed in");
  return done(
    { userId: user.id, name: user.name, role: user.role },
    `Signed in as ${user.name}`,
  );
}

export function signOut(db: PgDatabase, uid: string | null): ActionResult {
  pushAudit(db, actorName(db, uid), "Signed out");
  return done(undefined, "You have been logged out");
}

export function createWorkspace(input: EmptyPgInput): PgDatabase {
  return seedEmpty(input);
}

export function checkInTenant(
  db: PgDatabase,
  input: CheckInInput,
  uid: string | null,
): ActionResult<CheckInResultModel> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 2) return fail("Enter the tenant’s full name.");
  if (!/^[6-9]\d{9}$/.test(phone))
    return fail("Enter a valid 10-digit Indian mobile number.");
  if (!input.start) return fail("Pick a move-in date.");
  if (!(input.rent > 0)) return fail("Enter the monthly rent.");
  if (occupant(db, input.bedId))
    return fail("That bed was just taken. Pick another.");
  if (
    db.tenants.some(
      (tenant) =>
        tenant.phone === phone && tenant.status !== TenantStatusEnum.ended,
    )
  ) {
    return fail("A tenant with this phone is already checked in.");
  }
  const email = (
    input.email.trim() ||
    `${name.split(" ")[0]?.toLowerCase()}${phone.slice(-4)}@demo.in`
  ).toLowerCase();
  if (db.users.some((user) => user.email === email))
    return fail("This email already has an account.");
  const info = bedInfo(db, input.bedId);
  const tenant: TenantModel = {
    id: nextId(db, "t"),
    name,
    phone,
    email,
    bedId: input.bedId,
    rent: input.rent,
    deposit: input.deposit,
    start: input.start,
    dueDay: input.dueDay || 5,
    status: TenantStatusEnum.active,
    credit: 0,
    history: [],
  };
  db.tenants.push(tenant);
  db.users.push({
    id: `u_${tenant.id}`,
    email,
    password: "demo123",
    name,
    role: RoleEnum.tenant,
    tenantId: tenant.id,
  });
  if (input.depositCollected && input.deposit > 0) {
    db.deposits.push({
      id: nextId(db, "d"),
      tenantId: tenant.id,
      kind: DepositKindEnum.collected,
      amount: input.deposit,
      note: "Collected at check-in",
      date: input.start,
    });
  }
  const start = parseIso(input.start);
  const daysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();
  const amount = Math.round(
    (input.rent * (daysInMonth - start.getDate() + 1)) / daysInMonth,
  );
  const dueDate =
    start.getDate() <= tenant.dueDay
      ? toIso(new Date(start.getFullYear(), start.getMonth(), tenant.dueDay))
      : addDays(input.start, 2);
  db.charges.push({
    id: nextId(db, "c"),
    tenantId: tenant.id,
    type: "Rent",
    month: monthLabel(input.start),
    amount,
    due: dueDate,
  });
  const actor = userById(db, uid);
  pushAudit(
    db,
    actorName(db, uid),
    `Checked in ${name} to ${info.full} (${info.propertyName})`,
  );
  pushNotification(
    db,
    actor?.role === RoleEnum.owner ? ["staff"] : ["owner"],
    `${name} checked in to ${info.full}`,
    "tenants",
  );
  return done(
    {
      tenantId: tenant.id,
      name,
      email,
      bedLabel: info.full,
      firstRent: amount,
    },
    `${name} is checked in`,
  );
}

export function recordPayment(
  db: PgDatabase,
  input: RecordPaymentInput,
  uid: string | null,
): ActionResult<PaymentModel> {
  const tenant = tenantById(db, input.tenantId);
  if (!tenant) return fail("Tenant not found.");
  if (!(input.amount > 0)) return fail("Enter the amount received.");
  if (input.method === "UPI" && !input.reference.trim())
    return fail("Add the UPI reference (UTR).");
  const payment = addConfirmedPayment(db, tenant, {
    amount: input.amount,
    method: input.method,
    reference: input.reference.trim(),
    date: input.date || DEMO_TODAY,
    by: actorName(db, uid),
  });
  applyCredit(db, tenant);
  pushAudit(
    db,
    actorName(db, uid),
    `Recorded ${formatInr(input.amount)} (${input.method}) from ${tenant.name} · ${payment.receiptNo}`,
  );
  pushNotification(
    db,
    `t:${tenant.id}`,
    `Payment of ${formatInr(input.amount)} received. Receipt ${payment.receiptNo}`,
    "rent",
  );
  return done(payment, "Payment saved");
}

export function confirmPayment(
  db: PgDatabase,
  paymentId: string,
  uid: string | null,
): ActionResult {
  const payment = db.payments.find((item) => item.id === paymentId);
  const tenant = tenantById(db, payment?.tenantId);
  if (!payment || !tenant) return fail("Payment not found.");
  const split = allocate(db, tenant, payment.amount);
  payment.allocations = split.allocations;
  tenant.credit += split.credit;
  payment.status = PaymentStatusEnum.confirmed;
  db.receiptCounter += 1;
  payment.receiptNo = `RC-${String(db.receiptCounter).padStart(5, "0")}`;
  payment.by = `${actorName(db, uid)} (confirmed)`;
  pushAudit(
    db,
    actorName(db, uid),
    `Confirmed ${formatInr(payment.amount)} from ${tenant.name} · ${payment.receiptNo}`,
  );
  pushNotification(
    db,
    `t:${tenant.id}`,
    `Your payment of ${formatInr(payment.amount)} is confirmed. Receipt ${payment.receiptNo}`,
    "rent",
  );
  return done(undefined, "Payment confirmed");
}

export function rejectPayment(
  db: PgDatabase,
  paymentId: string,
  uid: string | null,
): ActionResult {
  const payment = db.payments.find((item) => item.id === paymentId);
  const tenant = tenantById(db, payment?.tenantId);
  if (!payment || !tenant) return fail("Payment not found.");
  payment.status = PaymentStatusEnum.rejected;
  pushAudit(
    db,
    actorName(db, uid),
    `Rejected payment proof from ${tenant.name}`,
  );
  pushNotification(
    db,
    `t:${tenant.id}`,
    `Your payment proof of ${formatInr(payment.amount)} could not be matched. Please check the UTR and try again.`,
    "rent",
  );
  return done(undefined, "Rejected");
}

export function submitPaymentProof(
  db: PgDatabase,
  utr: string,
  uid: string | null,
): ActionResult {
  const user = userById(db, uid);
  const tenant = tenantById(db, user?.tenantId);
  if (!tenant) return fail("Tenant not found.");
  if (!/^\d{12}$/.test(utr.trim()))
    return fail("Enter the 12-digit UTR from your UPI app.");
  if (db.payments.some((payment) => payment.reference === utr.trim())) {
    return fail("This UTR was already submitted.");
  }
  const amount = owed(db, tenant);
  addConfirmedPayment(db, tenant, {
    amount,
    method: "UPI",
    reference: utr.trim(),
    date: DEMO_TODAY,
    by: tenant.name,
    status: PaymentStatusEnum.pending,
  });
  const targets = ["owner", ...(db.settings.staffPay ? ["staff"] : [])];
  pushNotification(
    db,
    targets,
    `${tenant.name} says they paid ${formatInr(amount)} (UTR ${utr.trim()}). Please confirm.`,
    "dues",
  );
  pushAudit(db, tenant.name, `${tenant.name} submitted payment proof`);
  return done(undefined, "Sent to the owner for confirmation");
}

export function generateNextRent(
  db: PgDatabase,
  uid: string | null,
): ActionResult {
  const upcoming = nextMonth();
  let made = 0;
  let skipped = 0;
  for (const tenant of db.tenants) {
    if (tenant.status === TenantStatusEnum.ended) continue;
    const exists = db.charges.some(
      (charge) =>
        charge.tenantId === tenant.id &&
        charge.month === upcoming.label &&
        charge.type === "Rent",
    );
    if (exists) {
      skipped += 1;
      continue;
    }
    db.charges.push({
      id: nextId(db, "c"),
      tenantId: tenant.id,
      type: "Rent",
      month: upcoming.label,
      amount: tenant.rent,
      due: toIso(new Date(upcoming.year, upcoming.monthIndex, tenant.dueDay)),
    });
    made += 1;
    applyCredit(db, tenant);
  }
  pushAudit(
    db,
    actorName(db, uid),
    `Generated ${upcoming.label} rent: ${made} created, ${skipped} already existed`,
  );
  const message = made
    ? `${made} charges created for ${upcoming.label}`
    : `Nothing new: all ${skipped} tenants already have ${upcoming.label} rent`;
  return done(undefined, message);
}

export function transferTenant(
  db: PgDatabase,
  input: TransferInput,
  uid: string | null,
): ActionResult {
  const tenant = tenantById(db, input.tenantId);
  const bed = bedById(db, input.bedId);
  if (!tenant || !bed) return fail("Choose a vacant bed.");
  if (occupant(db, bed.id)) return fail("That bed is no longer vacant.");
  const from = bedInfo(db, tenant.bedId).full;
  tenant.bedId = bed.id;
  if (input.updateRent) tenant.rent = bedRent(db, bed);
  tenant.history.push({
    date: input.date || DEMO_TODAY,
    text: `Moved ${from} → ${bedInfo(db, bed.id).full}`,
  });
  pushAudit(
    db,
    actorName(db, uid),
    `Transferred ${tenant.name} from ${from} to ${bedInfo(db, bed.id).full}`,
  );
  pushNotification(
    db,
    `t:${tenant.id}`,
    `You have been moved to room ${bedInfo(db, bed.id).full}`,
    "home",
  );
  return done(undefined, "Transferred");
}

export function recordNotice(
  db: PgDatabase,
  input: NoticeInput,
  uid: string | null,
): ActionResult {
  const tenant = tenantById(db, input.tenantId);
  if (!tenant) return fail("Tenant not found.");
  if (!input.lastDay || input.lastDay < DEMO_TODAY)
    return fail("Pick a date after today.");
  tenant.status = TenantStatusEnum.notice;
  tenant.vacate = input.lastDay;
  const actor = userById(db, uid);
  pushAudit(
    db,
    actorName(db, uid),
    `${tenant.name} gave notice, leaving ${formatDayMonth(input.lastDay)}`,
  );
  const targets = ["owner", "staff"].filter((role) => role !== actor?.role);
  pushNotification(
    db,
    targets,
    `${tenant.name} will vacate on ${formatDayMonth(input.lastDay)}`,
    "tenants",
  );
  return done(undefined, "Notice recorded");
}

export function adjustTenant(
  db: PgDatabase,
  input: AdjustInput,
  uid: string | null,
): ActionResult {
  const tenant = tenantById(db, input.tenantId);
  if (!tenant) return fail("Tenant not found.");
  if (!(input.amount > 0) || !input.note.trim())
    return fail("Enter an amount and a note.");
  if (input.kind === "charge") {
    db.charges.push({
      id: nextId(db, "c"),
      tenantId: tenant.id,
      type: input.note.trim(),
      month: monthLabel(DEMO_TODAY),
      amount: input.amount,
      due: addDays(DEMO_TODAY, 5),
    });
    pushAudit(
      db,
      actorName(db, uid),
      `Added charge ${formatInr(input.amount)} (${input.note.trim()}) to ${tenant.name}`,
    );
    pushNotification(
      db,
      `t:${tenant.id}`,
      `New charge: ${input.note.trim()} ${formatInr(input.amount)}`,
      "rent",
    );
  } else {
    addConfirmedPayment(db, tenant, {
      amount: input.amount,
      method: "Discount",
      reference: input.note.trim(),
      date: DEMO_TODAY,
      by: actorName(db, uid),
    });
    pushAudit(
      db,
      actorName(db, uid),
      `Gave discount ${formatInr(input.amount)} (${input.note.trim()}) to ${tenant.name}`,
    );
    pushNotification(
      db,
      `t:${tenant.id}`,
      `Discount applied: ${formatInr(input.amount)} (${input.note.trim()})`,
      "rent",
    );
  }
  return done(undefined, "Applied");
}

export function checkoutTenant(
  db: PgDatabase,
  input: CheckoutInput,
  uid: string | null,
): ActionResult {
  const tenant = tenantById(db, input.tenantId);
  if (!tenant) return fail("Tenant not found.");
  if (input.deduction > 0 && !input.reason.trim())
    return fail("Add a reason for the deduction.");
  const dues = owed(db, tenant);
  const held = depositBalance(db, tenant.id);
  const net = held - dues - input.deduction;
  const last = bedInfo(db, tenant.bedId).full;
  if (dues > 0) {
    const applied = Math.min(dues, held);
    const split = allocate(db, tenant, applied);
    db.payments.unshift({
      id: nextId(db, "pay"),
      tenantId: tenant.id,
      amount: applied,
      method: "Deposit",
      reference: "Adjusted from deposit",
      date: DEMO_TODAY,
      status: PaymentStatusEnum.confirmed,
      by: actorName(db, uid),
      receiptNo: "",
      allocations: split.allocations,
    });
    db.deposits.push({
      id: nextId(db, "d"),
      tenantId: tenant.id,
      kind: DepositKindEnum.deduction,
      amount: applied,
      note: "Unpaid rent adjusted",
      date: DEMO_TODAY,
    });
  }
  if (input.deduction > 0 && net >= 0) {
    db.deposits.push({
      id: nextId(db, "d"),
      tenantId: tenant.id,
      kind: DepositKindEnum.deduction,
      amount: input.deduction,
      note: `Deduction: ${input.reason.trim()}`,
      date: DEMO_TODAY,
    });
  }
  if (net > 0) {
    db.deposits.push({
      id: nextId(db, "d"),
      tenantId: tenant.id,
      kind: DepositKindEnum.refund,
      amount: net,
      note: "Refunded to tenant",
      date: DEMO_TODAY,
    });
  }
  tenant.status = TenantStatusEnum.ended;
  tenant.lastBedId = tenant.bedId ?? undefined;
  tenant.bedId = null;
  tenant.vacate = input.lastDay || DEMO_TODAY;
  pushAudit(
    db,
    actorName(db, uid),
    `Checked out ${tenant.name} from ${last}. Refund ${formatInr(Math.max(net, 0))}`,
  );
  pushNotification(
    db,
    `t:${tenant.id}`,
    net > 0
      ? `Your checkout is complete. Deposit refund: ${formatInr(net)}`
      : "Your checkout is complete.",
    "home",
  );
  return done(undefined, `Checked out. Bed ${last} is now vacant`);
}

export function updateComplaint(
  db: PgDatabase,
  input: ComplaintUpdateInput,
  uid: string | null,
): ActionResult {
  const complaint = db.complaints.find((item) => item.id === input.complaintId);
  if (!complaint) return fail("Complaint not found.");
  const notes: string[] = [];
  if (input.status !== complaint.status) {
    complaint.events.push({
      at: nowLabel(),
      text: `Status changed to ${input.status} by ${actorName(db, uid)}`,
    });
    notes.push(`is now ${input.status}`);
    complaint.status = input.status;
  }
  if (input.assignee !== complaint.assignee) {
    complaint.assignee = input.assignee;
    if (input.assignee) {
      complaint.events.push({
        at: nowLabel(),
        text: `Assigned to ${input.assignee}`,
      });
      notes.push(`was assigned to ${input.assignee}`);
    }
  }
  if (!notes.length) return fail("No changes to save");
  pushNotification(
    db,
    `t:${complaint.tenantId}`,
    `Your complaint “${complaint.title}” ${notes.join(" and ")}`,
    "help",
  );
  pushAudit(
    db,
    actorName(db, uid),
    `Updated complaint “${complaint.title}”: ${notes.join(", ")}`,
  );
  return done(undefined, "Updated and tenant notified");
}

export function sendComplaintMessage(
  db: PgDatabase,
  complaintId: string,
  text: string,
  uid: string | null,
): ActionResult {
  const complaint = db.complaints.find((item) => item.id === complaintId);
  const user = userById(db, uid);
  if (!complaint || !user || !text.trim()) return fail("Write a message.");
  complaint.messages.push({
    by: user.name,
    role: user.role,
    text: text.trim(),
    at: nowLabel(),
  });
  if (user.role === RoleEnum.tenant) {
    pushNotification(
      db,
      complaint.isPrivate ? ["owner"] : ["owner", "staff"],
      `${user.name} replied on “${complaint.title}”`,
      "complaints",
    );
  } else {
    pushNotification(
      db,
      `t:${complaint.tenantId}`,
      `${user.name} replied on your complaint “${complaint.title}”`,
      "help",
    );
  }
  return done(undefined);
}

export function confirmComplaint(
  db: PgDatabase,
  complaintId: string,
): ActionResult {
  const complaint = db.complaints.find((item) => item.id === complaintId);
  if (!complaint) return fail("Complaint not found.");
  complaint.status = ComplaintStatusEnum.Closed;
  complaint.events.push({ at: nowLabel(), text: "Confirmed fixed by tenant" });
  pushNotification(
    db,
    complaint.isPrivate ? ["owner"] : ["owner", "staff"],
    `“${complaint.title}” confirmed fixed by tenant`,
    "complaints",
  );
  return done(undefined, "Thanks for confirming");
}

export function reopenComplaint(
  db: PgDatabase,
  complaintId: string,
): ActionResult {
  const complaint = db.complaints.find((item) => item.id === complaintId);
  if (!complaint) return fail("Complaint not found.");
  complaint.status = ComplaintStatusEnum.Open;
  complaint.events.push({
    at: nowLabel(),
    text: "Reopened by tenant: not fixed",
  });
  pushNotification(
    db,
    complaint.isPrivate ? ["owner"] : ["owner", "staff"],
    `“${complaint.title}” was reopened by the tenant`,
    "complaints",
  );
  return done(undefined, "Reopened");
}

export function createComplaint(
  db: PgDatabase,
  input: ComplaintInput,
  uid: string | null,
): ActionResult<ComplaintModel> {
  const user = userById(db, uid);
  const tenant = tenantById(db, user?.tenantId);
  if (!tenant) return fail("Sign in as a tenant to raise a complaint.");
  if (input.title.trim().length < 3 || input.description.trim().length < 5) {
    return fail("Add a title and a short description.");
  }
  const urgent = input.urgent || input.category === "Safety / urgent";
  const complaint: ComplaintModel = {
    id: nextId(db, "k"),
    tenantId: tenant.id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    photos: input.photos.slice(0, 3),
    urgent,
    isPrivate: input.isPrivate,
    status: ComplaintStatusEnum.Open,
    assignee: "",
    created: DEMO_TODAY,
    events: [
      {
        at: nowLabel(),
        text: `Raised by ${tenant.name}${urgent ? " as urgent" : ""}${input.isPrivate ? " (private)" : ""}`,
      },
    ],
    messages: [],
  };
  db.complaints.unshift(complaint);
  pushNotification(
    db,
    input.isPrivate ? ["owner"] : ["owner", "staff"],
    `${urgent ? "URGENT: " : ""}${tenant.name} raised a complaint: ${complaint.title}`,
    "complaints",
  );
  pushAudit(db, tenant.name, `Complaint raised: ${complaint.title}`);
  return done(complaint, "Sent. The owner has been notified");
}

export function postAnnouncement(
  db: PgDatabase,
  input: AnnouncementInput,
  uid: string | null,
): ActionResult {
  if (!input.title.trim() || !input.body.trim())
    return fail("Add a title and message");
  db.announcements.unshift({
    id: nextId(db, "a"),
    title: input.title.trim(),
    body: input.body.trim(),
    date: DEMO_TODAY,
  });
  for (const tenant of db.tenants) {
    if (tenant.status === TenantStatusEnum.ended) continue;
    pushNotification(
      db,
      `t:${tenant.id}`,
      `Announcement: ${input.title.trim()}`,
      "home",
    );
  }
  pushAudit(
    db,
    actorName(db, uid),
    `Posted announcement: ${input.title.trim()}`,
  );
  return done(undefined, "Posted to all tenants");
}

export function deleteAnnouncement(db: PgDatabase, id: string): ActionResult {
  db.announcements = db.announcements.filter((item) => item.id !== id);
  return done(undefined, "Announcement deleted");
}

export function setStaffPermission(
  db: PgDatabase,
  key: "staffPay" | "staffPrivate",
  value: boolean,
  uid: string | null,
): ActionResult {
  db.settings[key] = value;
  pushAudit(
    db,
    actorName(db, uid),
    `Changed staff permission ${key} to ${value}`,
  );
  return done(undefined, "Permission updated");
}

export function addStaff(
  db: PgDatabase,
  input: StaffInput,
  uid: string | null,
): ActionResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !/\S+@\S+/.test(email))
    return fail("Enter a name and a valid email.");
  if (db.users.some((user) => user.email === email))
    return fail("Email already in use.");
  db.users.push({
    id: nextId(db, "u"),
    email,
    password: "demo123",
    name,
    role: RoleEnum.staff,
    propertyId: input.propertyId,
  });
  pushAudit(db, actorName(db, uid), `Added staff ${name}`);
  return done(undefined, "Staff added. Password: demo123");
}

export function markNotificationRead(
  db: PgDatabase,
  id: string,
): ActionResult<{ link: string }> {
  const item = db.notifications.find((notification) => notification.id === id);
  if (!item) return fail("Notification not found.");
  item.read = true;
  return done({ link: item.link });
}

export function markAllRead(db: PgDatabase, uid: string | null): ActionResult {
  const user = userById(db, uid);
  if (!user) return fail("Sign in required.");
  const key = audienceKey(user);
  for (const item of db.notifications) {
    if (item.to === key) item.read = true;
  }
  return done(undefined);
}

export function sendReminder(
  db: PgDatabase,
  tenantId: string,
  uid: string | null,
): ActionResult {
  const tenant = tenantById(db, tenantId);
  if (!tenant) return fail("Tenant not found.");
  const status = duesStatus(db, tenant);
  pushNotification(
    db,
    `t:${tenant.id}`,
    `Rent reminder: ${formatInr(status.amount)} is outstanding. Pay by UPI and share the UTR.`,
    "rent",
  );
  pushAudit(db, actorName(db, uid), `Sent rent reminder to ${tenant.name}`);
  return done(undefined, `Reminder logged for ${tenant.name}`);
}

export function sendAllReminders(
  db: PgDatabase,
  propertyId: string,
  uid: string | null,
): ActionResult {
  const list = dueList(db, propertyId, "late");
  for (const tenant of list) {
    const status = duesStatus(db, tenant);
    pushNotification(
      db,
      `t:${tenant.id}`,
      `Rent reminder: ${formatInr(status.amount)} is overdue. Please pay and share the UTR.`,
      "rent",
    );
  }
  pushAudit(
    db,
    actorName(db, uid),
    `Sent reminders to ${list.length} overdue tenants`,
  );
  return done(undefined, `Reminders sent to ${list.length} tenants`);
}

export function reminderCopy(
  db: PgDatabase,
  tenantId: string,
  language: "en" | "te" | "hi",
) {
  const tenant = tenantById(db, tenantId);
  if (!tenant) return "";
  const status = duesStatus(db, tenant);
  const info = bedInfo(db, tenant.bedId);
  const charge = openCharges(db, tenant)[0];
  if (!charge) return "";
  const first = tenant.name.split(" ")[0] ?? tenant.name;
  const room = info.full.split(" · ")[0] ?? info.full;
  if (language === "te") {
    return `నమస్తే ${first}, ${info.propertyName} (గది ${room}) ${charge.month} అద్దె ${formatInr(status.amount)} ${formatDayMonth(charge.due)} న చెల్లించాల్సి ఉంది. దయచేసి ${db.settings.upi} కు UPI ద్వారా చెల్లించి UTR పంపండి. ధన్యవాదాలు!`;
  }
  if (language === "hi") {
    return `नमस्ते ${first}, ${info.propertyName} (कमरा ${room}) का ${charge.month} का किराया ${formatInr(status.amount)} ${formatDayMonth(charge.due)} को देय था। कृपया ${db.settings.upi} पर UPI से भुगतान करके UTR भेजें। धन्यवाद!`;
  }
  return `Hi ${first}, your ${charge.month} rent of ${formatInr(status.amount)} for ${info.propertyName} (Room ${room}) was due on ${formatDayMonth(charge.due)}. Please pay by UPI to ${db.settings.upi} and reply with the UTR. Thank you!`;
}

export function addProperty(
  db: PgDatabase,
  input: PropertyInput,
  uid: string | null,
): ActionResult<PropertyModel> {
  const name = input.name.trim();
  if (name.length < 2) return fail("Enter the property name.");
  const property: PropertyModel = {
    id: nextId(db, "p"),
    name,
    area: input.area.trim(),
    bedStyle: input.bedStyle,
    floors: [],
  };
  db.properties.push(property);
  pushAudit(db, actorName(db, uid), `Added property ${name}`);
  return done(property, "Property added. Now add floors and rooms");
}

export function updateProperty(
  db: PgDatabase,
  propertyId: string,
  input: PropertyInput,
  uid: string | null,
): ActionResult {
  const property = propertyById(db, propertyId);
  const name = input.name.trim();
  if (!property) return fail("Property not found.");
  if (name.length < 2) return fail("Enter the property name.");
  property.name = name;
  property.area = input.area.trim();
  property.bedStyle = input.bedStyle;
  pushAudit(db, actorName(db, uid), `Edited property ${name}`);
  return done(undefined, "Saved");
}

export function addFloor(
  db: PgDatabase,
  propertyId: string,
  input: FloorInput,
  uid: string | null,
): ActionResult {
  const property = propertyById(db, propertyId);
  if (!property) return fail("Property not found.");
  if (!Number.isFinite(input.number) || input.number < 0 || input.number > 60) {
    return fail("Enter a floor number from 0 to 60.");
  }
  const key = String(input.number);
  if (property.floors.some((floor) => floor.key === key))
    return fail("That floor already exists.");
  ensureFloor(property, key, input.label.trim());
  pushAudit(
    db,
    actorName(db, uid),
    `Added ${floorName(property, key)} to ${property.name}`,
  );
  return done(undefined, "Floor added");
}

export function renameFloor(
  db: PgDatabase,
  propertyId: string,
  floorKey: string,
  label: string,
): ActionResult {
  const property = propertyById(db, propertyId);
  if (!property) return fail("Property not found.");
  const next = label.trim();
  if (!next) return fail("Enter a name.");
  ensureFloor(property, floorKey, next);
  for (const floor of property.floors) {
    if (floor.key === floorKey) floor.label = next;
  }
  return done(undefined, "Floor renamed");
}

export function deleteFloor(
  db: PgDatabase,
  propertyId: string,
  floorKey: string,
  uid: string | null,
): ActionResult {
  const property = propertyById(db, propertyId);
  if (!property) return fail("Property not found.");
  if (roomsOnFloor(db, property.id, floorKey).length)
    return fail("Move the rooms off this floor first.");
  property.floors = property.floors.filter((floor) => floor.key !== floorKey);
  pushAudit(db, actorName(db, uid), "Deleted an empty floor");
  return done(undefined, "Floor deleted");
}

export function addRoom(
  db: PgDatabase,
  propertyId: string,
  input: RoomInput,
  uid: string | null,
): ActionResult {
  const property = propertyById(db, propertyId);
  if (!property) return fail("Property not found.");
  const label = input.label.trim();
  if (!label) return fail("Enter a room number or name.");
  if (
    propertyRooms(db, property.id).some(
      (room) => room.label.toLowerCase() === label.toLowerCase(),
    )
  ) {
    return fail(`Room “${label}” already exists in this property.`);
  }
  if (!Number.isFinite(input.beds) || input.beds < 1 || input.beds > 12)
    return fail("Beds per room must be 1 to 12.");
  if (!(input.rent > 0)) return fail("Enter the rent per bed.");
  ensureFloor(property, input.floorKey);
  makeRoom(
    db,
    property,
    label,
    input.floorKey,
    input.beds,
    input.rent,
    input.type,
  );
  pushAudit(
    db,
    actorName(db, uid),
    `Added room ${label} (${input.beds} beds) to ${property.name}`,
  );
  return done(undefined, `Room ${label} added with ${input.beds} beds`);
}

export function updateRoom(
  db: PgDatabase,
  input: RoomUpdateInput,
  uid: string | null,
): ActionResult {
  const room = roomById(db, input.roomId);
  const property = propertyById(db, room?.propertyId);
  if (!room || !property) return fail("Room not found.");
  const label = input.label.trim();
  if (!label) return fail("Enter a room number or name.");
  if (
    db.rooms.some(
      (item) =>
        item.propertyId === property.id &&
        item.id !== room.id &&
        item.label.toLowerCase() === label.toLowerCase(),
    )
  ) {
    return fail(`Another room in this property already uses “${label}”.`);
  }
  if (!(input.rent > 0)) return fail("Enter the rent per bed.");
  room.label = label;
  room.floorKey = input.floorKey;
  room.type = input.type;
  room.rent = input.rent;
  ensureFloor(property, input.floorKey);
  for (const bedRentInput of input.bedRents) {
    const bed = bedById(db, bedRentInput.id);
    if (bed && bed.roomId === room.id)
      bed.rentOverride = bedRentInput.rentOverride;
  }
  pushAudit(db, actorName(db, uid), `Edited room ${room.label}`);
  return done(undefined, "Room saved");
}

export function addBed(
  db: PgDatabase,
  roomId: string,
  uid: string | null,
): ActionResult {
  const room = roomById(db, roomId);
  const property = propertyById(db, room?.propertyId);
  if (!room || !property) return fail("Room not found.");
  if (bedsInRoom(db, room.id).length >= 12)
    return fail("A room can have at most 12 beds.");
  db.beds.push({
    id: nextId(db, "b"),
    roomId: room.id,
    label: nextBedLabel(db, property, room),
    rentOverride: null,
    outOfService: false,
  });
  pushAudit(db, actorName(db, uid), `Added a bed to room ${room.label}`);
  return done(undefined, "Bed added");
}

export function removeBed(
  db: PgDatabase,
  roomId: string,
  bedId: string,
  uid: string | null,
): ActionResult {
  const room = roomById(db, roomId);
  if (!room) return fail("Room not found.");
  if (occupant(db, bedId))
    return fail("Check the tenant out or transfer them first.");
  if (bedsInRoom(db, room.id).length <= 1)
    return fail("A room needs at least one bed. Delete the room instead.");
  db.beds = db.beds.filter((bed) => bed.id !== bedId);
  pushAudit(db, actorName(db, uid), `Removed a bed from room ${room.label}`);
  return done(undefined, "Bed removed");
}

export function toggleBedService(db: PgDatabase, bedId: string): ActionResult {
  const bed = bedById(db, bedId);
  if (!bed) return fail("Bed not found.");
  if (occupant(db, bed.id)) return fail("Bed is occupied.");
  bed.outOfService = !bed.outOfService;
  return done(
    undefined,
    bed.outOfService ? "Bed marked out of service" : "Bed restored",
  );
}

export function removeOrArchiveRoom(
  db: PgDatabase,
  roomId: string,
  uid: string | null,
): ActionResult {
  const room = roomById(db, roomId);
  if (!room) return fail("Room not found.");
  const beds = bedsInRoom(db, room.id);
  if (beds.some((bed) => occupant(db, bed.id)))
    return fail("Move or check out the tenants in this room first.");
  const used = db.tenants.some((tenant) =>
    beds.some((bed) => bed.id === tenant.bedId || bed.id === tenant.lastBedId),
  );
  if (used) {
    room.archived = !room.archived;
    pushAudit(
      db,
      actorName(db, uid),
      `${room.archived ? "Archived" : "Restored"} room ${room.label}`,
    );
    return done(
      undefined,
      room.archived ? "Room archived. History is kept" : "Room restored",
    );
  }
  db.beds = db.beds.filter((bed) => bed.roomId !== room.id);
  db.rooms = db.rooms.filter((item) => item.id !== room.id);
  pushAudit(db, actorName(db, uid), `Deleted room ${room.label}`);
  return done(undefined, "Room deleted");
}

export interface BulkPlan {
  error?: string;
  floors: { key: string; labels: string[] }[];
  rooms: number;
  beds: number;
  skipped: number;
}

export function planBulkRooms(
  db: PgDatabase,
  propertyId: string,
  input: BulkRoomsInput,
): BulkPlan {
  const property = propertyById(db, propertyId);
  if (!property)
    return {
      error: "Property not found.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  if (
    !Number.isFinite(input.firstFloor) ||
    input.firstFloor < 0 ||
    input.firstFloor > 60
  ) {
    return {
      error: "First floor must be 0 (Ground) to 60.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  }
  if (!Number.isFinite(input.floors) || input.floors < 1 || input.floors > 30) {
    return {
      error: "Number of floors must be 1 to 30.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  }
  if (
    !Number.isFinite(input.roomsPerFloor) ||
    input.roomsPerFloor < 1 ||
    input.roomsPerFloor > 60
  ) {
    return {
      error: "Rooms per floor must be 1 to 60.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  }
  if (
    !Number.isFinite(input.bedsPerRoom) ||
    input.bedsPerRoom < 1 ||
    input.bedsPerRoom > 12
  ) {
    return {
      error: "Beds per room must be 1 to 12.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  }
  if (!(input.rent > 0))
    return {
      error: "Enter the rent per bed.",
      floors: [],
      rooms: 0,
      beds: 0,
      skipped: 0,
    };
  let sequence =
    propertyRooms(db, property.id).reduce(
      (max, room) =>
        /^\d+$/.test(room.label) ? Math.max(max, Number(room.label)) : max,
      0,
    ) + 1;
  const existing = propertyRooms(db, property.id).map((room) =>
    room.label.toLowerCase(),
  );
  const floors: BulkPlan["floors"] = [];
  let skipped = 0;
  let total = 0;
  for (let index = 0; index < input.floors; index += 1) {
    const floor = input.firstFloor + index;
    const labels: string[] = [];
    for (let roomIndex = 1; roomIndex <= input.roomsPerFloor; roomIndex += 1) {
      const label =
        input.numbering === "seq"
          ? String(sequence++)
          : input.numbering === "dash"
            ? `${floor === 0 ? "G" : floor}-${String(roomIndex).padStart(2, "0")}`
            : floor === 0
              ? `G${String(roomIndex).padStart(2, "0")}`
              : String(floor * 100 + roomIndex);
      if (existing.includes(label.toLowerCase())) {
        skipped += 1;
        continue;
      }
      labels.push(label);
      existing.push(label.toLowerCase());
    }
    total += labels.length;
    floors.push({ key: String(floor), labels });
  }
  return { floors, rooms: total, beds: total * input.bedsPerRoom, skipped };
}

export function bulkCreateRooms(
  db: PgDatabase,
  propertyId: string,
  input: BulkRoomsInput,
  uid: string | null,
): ActionResult {
  const property = propertyById(db, propertyId);
  const plan = planBulkRooms(db, propertyId, input);
  if (!property) return fail("Property not found.");
  if (plan.error) return fail(plan.error);
  if (!plan.rooms) return fail("Nothing new to create");
  for (const floor of plan.floors) {
    ensureFloor(property, floor.key);
    for (const label of floor.labels) {
      makeRoom(
        db,
        property,
        label,
        floor.key,
        input.bedsPerRoom,
        input.rent,
        input.type,
      );
    }
  }
  pushAudit(
    db,
    actorName(db, uid),
    `Bulk created ${plan.rooms} rooms (${plan.beds} beds) in ${property.name}`,
  );
  return done(undefined, `${plan.rooms} rooms and ${plan.beds} beds created`);
}

export function proratedRent(start: string, rent: number) {
  const date = parseIso(start || DEMO_TODAY);
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const remaining = daysInMonth - date.getDate() + 1;
  return {
    amount: Math.round((rent * remaining) / daysInMonth),
    remaining,
    daysInMonth,
    label: monthLabel(toIso(date)),
  };
}

export function complaintTone(status: ComplaintStatusEnum) {
  if (status === ComplaintStatusEnum.Open) return DuesToneEnum.late;
  if (status === ComplaintStatusEnum.Acknowledged) return DuesToneEnum.soon;
  if (status === ComplaintStatusEnum.InProgress) return DuesToneEnum.part;
  if (status === ComplaintStatusEnum.Resolved) return DuesToneEnum.paid;
  return DuesToneEnum.gy;
}
