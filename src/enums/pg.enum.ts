export enum TenantStatusEnum {
  active = "active",
  notice = "notice",
  ended = "ended",
}

export enum PaymentStatusEnum {
  confirmed = "confirmed",
  pending = "pending",
  rejected = "rejected",
}

export enum ComplaintStatusEnum {
  Open = "Open",
  Acknowledged = "Acknowledged",
  InProgress = "In progress",
  Resolved = "Resolved",
  Closed = "Closed",
}

export enum DuesToneEnum {
  late = "late",
  part = "part",
  soon = "soon",
  paid = "paid",
  gy = "gy",
}

export enum BedStyleEnum {
  alpha = "alpha",
  num = "num",
}

export enum DepositKindEnum {
  collected = "collected",
  deduction = "deduction",
  refund = "refund",
}

export enum TenantFilterEnum {
  active = "active",
  notice = "notice",
  ended = "ended",
  all = "all",
}

export enum DuesFilterEnum {
  all = "all",
  late = "late",
  part = "part",
  soon = "soon",
  paid = "paid",
}

export enum ComplaintFilterEnum {
  all = "all",
  open = "open",
  done = "done",
}
