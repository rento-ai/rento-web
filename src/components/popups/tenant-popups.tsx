"use client";

import { Check, MessageSquare } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Checkbox } from "@/components/checkbox";
import { Initials } from "@/components/initials";
import { Input } from "@/components/input";
import { PopupFrame } from "@/components/popups/popup-frame";
import { RentoButton } from "@/components/rento-button";
import { Segmented } from "@/components/segmented";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { StatusPill } from "@/components/status-pill";
import { DuesToneEnum, TenantStatusEnum } from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import { StatusCode } from "@/enums/status-code.enum";
import {
  addDays,
  DEMO_PASSWORD,
  DEMO_TODAY,
  dayDiff,
  formatDayMonth,
  formatFullDate,
  formatInr,
} from "@/lib/constants";
import {
  allocate,
  balance,
  bedInfo,
  bedRent,
  can,
  chargesOf,
  depositBalance,
  duesStatus,
  floorName,
  owed,
  proratedRent,
  reminderCopy,
  roomById,
  tenantById,
  userById,
  vacantBeds,
} from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
      {label}
      {children}
    </label>
  );
}

export function CheckInPopup({ bedId }: { bedId?: string }) {
  const db = usePgStore((state) => state.db);
  const beds = vacantBeds(db);
  const first = beds.find((bed) => bed.id === bedId) ?? beds[0];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedBed, setSelectedBed] = useState(first?.id ?? "");
  const [start, setStart] = useState(DEMO_TODAY);
  const [dueDay, setDueDay] = useState(5);
  const [rent, setRent] = useState(first ? bedRent(db, first) : 7000);
  const [deposit, setDeposit] = useState(
    (first ? bedRent(db, first) : 7000) * 2,
  );
  const [collected, setCollected] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const openModal = useUiStore((state) => state.openModal);
  const preview = proratedRent(start, rent);

  if (!first) {
    return (
      <PopupFrame title="Check in a tenant">
        <p className="text-sm text-[var(--muted)]">No vacant beds available.</p>
      </PopupFrame>
    );
  }

  return (
    <PopupFrame title="Check in a tenant">
      <div className="flex flex-col gap-3.5">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Full name">
            <Input
              value={name}
              placeholder="e.g. Aditya Verma"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={phone}
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Email (for login, optional)">
          <Input
            type="email"
            value={email}
            placeholder="name@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Bed">
          <Select
            value={selectedBed}
            onValueChange={(value) => {
              const bed = beds.find((item) => item.id === value);
              setSelectedBed(value);
              if (bed) {
                const nextRent = bedRent(db, bed);
                setRent(nextRent);
                setDeposit(nextRent * 2);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {db.properties.map((property) => {
                const options = beds.filter(
                  (bed) => roomById(db, bed.roomId)?.propertyId === property.id,
                );
                if (!options.length) return null;
                return (
                  <SelectGroup key={property.id}>
                    <SelectLabel>{property.name}</SelectLabel>
                    {options.map((bed) => {
                      const room = roomById(db, bed.roomId);
                      return (
                        <SelectItem key={bed.id} value={bed.id}>
                          {room
                            ? `${floorName(property, room.floorKey)} · Room ${room.label} · Bed ${bed.label}`
                            : bed.label}{" "}
                          ({formatInr(bedRent(db, bed))})
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Move-in date">
            <Input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </Field>
          <Field label="Rent due day">
            <Input
              type="number"
              min={1}
              max={28}
              value={dueDay}
              onChange={(event) => setDueDay(Number(event.target.value))}
            />
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Monthly rent (₹)">
            <Input
              type="number"
              min={0}
              value={rent}
              onChange={(event) => setRent(Number(event.target.value))}
            />
          </Field>
          <Field label="Security deposit (₹)">
            <Input
              type="number"
              min={0}
              value={deposit}
              onChange={(event) => setDeposit(Number(event.target.value))}
            />
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={collected}
            onCheckedChange={(value) => setCollected(value === true)}
          />
          Deposit collected now
        </label>
        <div className="rounded-[18px] bg-[var(--sub)] p-4 text-sm">
          <b>First-month rent: {formatInr(preview.amount)}</b>
          <div className="mt-0.5 text-xs text-[var(--muted)]">
            {preview.remaining} of {preview.daysInMonth} days in {preview.label}{" "}
            (prorated, rounded to the rupee). Full rent from next month.
          </div>
        </div>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const response = await ApiService.checkInTenant({
              name,
              phone,
              email,
              bedId: selectedBed,
              start,
              dueDay,
              rent,
              deposit,
              depositCollected: collected,
            });
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK || !response.data) {
              setError(response.message);
              return;
            }
            openModal({ type: "checked-in", result: response.data });
          }}
        >
          Check in & create login
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function CheckedInPopup({
  result,
}: {
  result: { name: string; email: string; bedLabel: string; firstRent: number };
}) {
  const closeModal = useUiStore((state) => state.closeModal);
  return (
    <PopupFrame title="Checked in">
      <div className="flex flex-col gap-3.5">
        <div className="rounded-[18px] bg-[var(--green-tint)] p-4 text-[var(--green)]">
          <b>
            {result.name} is now in {result.bedLabel}.
          </b>
          <p className="mt-1.5 text-sm">
            First month rent {formatInr(result.firstRent)} was generated.
          </p>
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm">
          <span className="text-[var(--muted)]">Tenant login</span>
          <b>{result.email}</b>
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm">
          <span className="text-[var(--muted)]">Password</span>
          <b>{DEMO_PASSWORD}</b>
        </div>
        <p className="text-xs text-[var(--muted)]">
          In the real product the tenant gets an invite by WhatsApp or SMS. Log
          out and sign in with these details to see their view.
        </p>
        <RentoButton variant="primary" className="w-full" onClick={closeModal}>
          Done
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function TenantPopup({ tenantId }: { tenantId: string }) {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const tenant = tenantById(db, tenantId);
  if (!tenant) return null;
  const status = duesStatus(db, tenant);
  const info = bedInfo(db, tenant.bedId ?? tenant.lastBedId);
  const charges = chargesOf(db, tenant.id)
    .sort((a, b) => (a.due < b.due ? 1 : -1))
    .slice(0, 4);
  const receipts = db.payments
    .filter(
      (payment) =>
        payment.tenantId === tenant.id &&
        payment.status === "confirmed" &&
        payment.receiptNo,
    )
    .slice(0, 3);
  const deposits = db.deposits.filter(
    (deposit) => deposit.tenantId === tenant.id,
  );
  const onNotice =
    tenant.status === TenantStatusEnum.notice &&
    status.tone === DuesToneEnum.paid;

  return (
    <PopupFrame title={tenant.name} wide>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Initials name={tenant.name} className="size-12" />
          <div className="flex-1">
            <div className="text-xs text-[var(--muted)]">
              {tenant.phone} · {tenant.email}
            </div>
            <div className="text-sm">
              {info.propertyName} · Room {info.full}
            </div>
          </div>
          <StatusPill tone={onNotice ? DuesToneEnum.part : status.tone}>
            {onNotice ? "On notice" : status.text}
          </StatusPill>
        </div>
        <KeyRow label="Monthly rent" value={formatInr(tenant.rent)} />
        <KeyRow
          label="Outstanding"
          value={formatInr(owed(db, tenant))}
          danger={owed(db, tenant) > 0}
        />
        <KeyRow
          label="Deposit held"
          value={formatInr(depositBalance(db, tenant.id))}
        />
        {tenant.credit ? (
          <KeyRow label="Advance credit" value={formatInr(tenant.credit)} />
        ) : null}
        <KeyRow label="Joined" value={formatFullDate(tenant.start)} />
        {tenant.vacate ? (
          <KeyRow
            label={
              tenant.status === TenantStatusEnum.ended ? "Left" : "Leaving"
            }
            value={formatFullDate(tenant.vacate)}
          />
        ) : null}
        <div>
          <b className="text-sm">Charges</b>
          {charges.map((charge) => {
            const left = balance(db, charge);
            return (
              <div
                key={charge.id}
                className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm"
              >
                <span className="text-[var(--muted)]">
                  {charge.type} · {charge.month}
                </span>
                <b className="flex items-center gap-2">
                  {formatInr(charge.amount)}
                  {left === 0 ? (
                    <StatusPill tone={DuesToneEnum.paid}>Paid</StatusPill>
                  ) : (
                    <StatusPill
                      tone={
                        dayDiff(charge.due, DEMO_TODAY) > 0
                          ? DuesToneEnum.late
                          : DuesToneEnum.soon
                      }
                    >
                      {formatInr(left)} due
                    </StatusPill>
                  )}
                </b>
              </div>
            );
          })}
        </div>
        {receipts.length ? (
          <div>
            <b className="text-sm">Recent receipts</b>
            {receipts.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 border-t border-[var(--line)] py-2 text-sm"
              >
                <span className="text-[var(--muted)]">
                  {formatDayMonth(payment.date)} · {payment.method}
                </span>
                <RentoButton
                  size="sm"
                  onClick={() =>
                    openModal({ type: "receipt", paymentId: payment.id })
                  }
                >
                  {formatInr(payment.amount)} · {payment.receiptNo}
                </RentoButton>
              </div>
            ))}
          </div>
        ) : null}
        <div>
          <b className="text-sm">Deposit ledger</b>
          {deposits.map((deposit) => (
            <KeyRow
              key={deposit.id}
              label={deposit.note}
              value={`${deposit.kind === "collected" ? "+" : "−"}${formatInr(deposit.amount)}`}
            />
          ))}
        </div>
        {tenant.history.length ? (
          <div>
            <b className="text-sm">History</b>
            {tenant.history.map((item) => (
              <KeyRow
                key={`${item.date}-${item.text}`}
                label={formatDayMonth(item.date)}
                value={item.text}
              />
            ))}
          </div>
        ) : null}
        {tenant.status !== TenantStatusEnum.ended ? (
          <div className="flex flex-wrap gap-2">
            {owed(db, tenant) > 0 ? (
              <>
                <RentoButton
                  size="sm"
                  variant="success"
                  onClick={() => openModal({ type: "remind", tenantId })}
                >
                  <MessageSquare />
                  Remind
                </RentoButton>
                {can(db, user, "pay") ? (
                  <RentoButton
                    size="sm"
                    variant="primary"
                    onClick={() => openModal({ type: "pay", tenantId })}
                  >
                    Record payment
                  </RentoButton>
                ) : null}
              </>
            ) : null}
            {can(db, user, "transfer") ? (
              <RentoButton
                size="sm"
                onClick={() => openModal({ type: "transfer", tenantId })}
              >
                Transfer bed
              </RentoButton>
            ) : null}
            {tenant.status === TenantStatusEnum.active &&
            can(db, user, "notice") ? (
              <RentoButton
                size="sm"
                onClick={() => openModal({ type: "notice", tenantId })}
              >
                Give notice
              </RentoButton>
            ) : null}
            {user?.role === RoleEnum.owner ? (
              <>
                <RentoButton
                  size="sm"
                  onClick={() => openModal({ type: "adjust", tenantId })}
                >
                  Charge / discount
                </RentoButton>
                <RentoButton
                  size="sm"
                  variant="danger"
                  onClick={() => openModal({ type: "checkout", tenantId })}
                >
                  Settle & check out
                </RentoButton>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </PopupFrame>
  );
}

function KeyRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <b className={danger ? "text-[var(--red)]" : undefined}>{value}</b>
    </div>
  );
}

export function PayPopup({ tenantId }: { tenantId: string }) {
  const db = usePgStore((state) => state.db);
  const tenant = tenantById(db, tenantId);
  const openModal = useUiStore((state) => state.openModal);
  const outstanding = tenant ? owed(db, tenant) : 0;
  const [amount, setAmount] = useState(outstanding);
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(DEMO_TODAY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const preview = useMemo(
    () => (tenant ? allocate(db, tenant, Math.max(0, amount)) : null),
    [db, tenant, amount],
  );
  if (!tenant || !preview) return null;
  const remaining = owed(db, tenant) - (amount - preview.credit);

  return (
    <PopupFrame title="Record payment">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <Initials name={tenant.name} />
          <div>
            <b>{tenant.name}</b>
            <div className="text-xs text-[var(--muted)]">
              {bedInfo(db, tenant.bedId).full} · Balance{" "}
              {formatInr(outstanding)}
            </div>
          </div>
        </div>
        <Field label="Amount received (₹)">
          <Input
            className="h-[58px] text-[22px] font-extrabold"
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </Field>
        <div className="text-[13px] font-semibold text-[var(--muted)]">
          Method
          <div className="mt-1.5">
            <Segmented
              value={method}
              onChange={setMethod}
              label="Payment method"
              options={[
                { value: "UPI", label: "UPI" },
                { value: "Cash", label: "Cash" },
                { value: "Bank", label: "Bank" },
              ]}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Reference (UTR)">
            <Input
              value={reference}
              placeholder="Optional for cash"
              onChange={(event) => setReference(event.target.value)}
            />
          </Field>
          <Field label="Received on">
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="rounded-[18px] bg-[var(--sub)] p-4 text-sm">
          {preview.allocations.map((line) => {
            const charge = db.charges.find((item) => item.id === line.chargeId);
            return (
              <div key={line.chargeId} className="flex text-sm">
                <span className="flex-1">Applied to {charge?.month} rent</span>
                <b>{formatInr(line.amount)}</b>
              </div>
            );
          })}
          {!preview.allocations.length ? (
            <span className="text-[var(--muted)]">
              Nothing outstanding to apply to.
            </span>
          ) : null}
          {remaining > 0 ? (
            <div className="mt-1.5 flex text-sm">
              <span className="flex-1">Remaining balance</span>
              <b className="text-[var(--red)]">{formatInr(remaining)}</b>
            </div>
          ) : null}
          {preview.credit > 0 ? (
            <div className="mt-1.5 flex text-sm">
              <span className="flex-1">Extra kept as advance credit</span>
              <b>{formatInr(preview.credit)}</b>
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const response = await ApiService.recordPayment({
              tenantId,
              amount,
              method,
              reference,
              date,
            });
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK || !response.data) {
              setError(response.message);
              return;
            }
            openModal({ type: "receipt", paymentId: response.data.id });
          }}
        >
          <Check /> Save & issue receipt
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function RemindPopup({ tenantId }: { tenantId: string }) {
  const db = usePgStore((state) => state.db);
  const closeModal = useUiStore((state) => state.closeModal);
  const tenant = tenantById(db, tenantId);
  const [language, setLanguage] = useState<"en" | "te" | "hi">("en");
  if (!tenant) return null;
  const text = reminderCopy(db, tenantId, language);
  const info = bedInfo(db, tenant.bedId);
  return (
    <PopupFrame title="Send reminder">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <Initials name={tenant.name} />
          <div>
            <b>{tenant.name}</b>
            <div className="text-xs text-[var(--muted)]">
              {tenant.phone} · {info.full}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["en", "English"],
              ["te", "తెలుగు"],
              ["hi", "हिन्दी"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`h-11 rounded-full border px-3.5 text-sm font-semibold ${language === value ? "border-[var(--teal)] bg-[var(--teal)] text-white" : "border-[var(--line-strong)] bg-white"}`}
              onClick={() => setLanguage(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl rounded-br-sm bg-[#DCF3E3] px-3.5 py-3 text-sm text-[#10281A]">
          {text}
        </div>
        <a
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[var(--green-tint)] text-sm font-bold text-[var(--green)]"
          href={`https://wa.me/91${tenant.phone}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => ApiService.sendReminder(tenantId)}
        >
          <MessageSquare className="size-4" /> Open in WhatsApp
        </a>
        <RentoButton
          className="w-full"
          onClick={async () => {
            await ApiService.sendReminder(tenantId);
            closeModal();
          }}
        >
          Mark as sent (in-app alert to tenant)
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function ReceiptPopup({ paymentId }: { paymentId: string }) {
  const db = usePgStore((state) => state.db);
  const payment = db.payments.find((item) => item.id === paymentId);
  const tenant = tenantById(db, payment?.tenantId);
  if (!payment || !tenant) return null;
  const info = bedInfo(db, tenant.bedId ?? tenant.lastBedId);
  const months = payment.allocations
    .map(
      (allocation) =>
        db.charges.find((charge) => charge.id === allocation.chargeId)?.month,
    )
    .filter(Boolean)
    .join(", ");
  return (
    <PopupFrame title="Receipt">
      <div className="receipt-print flex flex-col gap-3.5">
        <div className="text-center">
          <div className="mx-auto mb-2 inline-flex size-14 items-center justify-center rounded-full bg-[var(--green-tint)] text-[var(--green)]">
            <Check />
          </div>
          <div className="text-sm text-[var(--muted)]">Payment received</div>
          <div className="text-[34px] font-extrabold tracking-tight">
            {formatInr(payment.amount)}
          </div>
        </div>
        <KeyRow label="Receipt no." value={payment.receiptNo} />
        <KeyRow label="Paid on" value={formatFullDate(payment.date)} />
        <KeyRow
          label="Method"
          value={`${payment.method}${payment.reference ? ` · ${payment.reference}` : ""}`}
        />
        <KeyRow label="Tenant" value={tenant.name} />
        <KeyRow
          label="PG · Room"
          value={`${info.propertyName} · ${info.full}`}
        />
        <KeyRow label="Applied to" value={months || "—"} />
        <KeyRow label="Recorded by" value={payment.by} />
      </div>
      <RentoButton
        variant="primary"
        size="lg"
        className="w-full print:hidden"
        onClick={() => window.print()}
      >
        Print / save as PDF
      </RentoButton>
    </PopupFrame>
  );
}

export function CheckoutPopup({ tenantId }: { tenantId: string }) {
  const db = usePgStore((state) => state.db);
  const closeModal = useUiStore((state) => state.closeModal);
  const tenant = tenantById(db, tenantId);
  const [deduction, setDeduction] = useState(0);
  const [reason, setReason] = useState("");
  const [lastDay, setLastDay] = useState(tenant?.vacate || DEMO_TODAY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!tenant) return null;
  const held = depositBalance(db, tenant.id);
  const dues = owed(db, tenant);
  const net = held - dues - deduction;
  return (
    <PopupFrame title="Settle & check out">
      <div className="flex flex-col gap-3.5">
        <KeyRow label="Deposit held" value={formatInr(held)} />
        <KeyRow
          label="Unpaid rent and charges"
          value={`−${formatInr(dues)}`}
          danger
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Other deduction (₹)">
            <Input
              type="number"
              min={0}
              value={deduction}
              onChange={(event) => setDeduction(Number(event.target.value))}
            />
          </Field>
          <Field label="Reason">
            <Input
              value={reason}
              placeholder="e.g. damaged wardrobe"
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Last day">
          <Input
            type="date"
            value={lastDay}
            onChange={(event) => setLastDay(event.target.value)}
          />
        </Field>
        <div className="rounded-[18px] bg-[var(--sub)] p-4">
          {net >= 0 ? (
            <div>
              <div className="flex">
                <b className="flex-1">Refund to tenant</b>
                <b className="text-[22px] text-[var(--green)]">
                  {formatInr(net)}
                </b>
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Pay by UPI or bank and note the reference after confirming.
              </div>
            </div>
          ) : (
            <div className="flex">
              <b className="flex-1">Tenant still owes</b>
              <b className="text-[22px] text-[var(--red)]">{formatInr(-net)}</b>
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const response = await ApiService.checkoutTenant({
              tenantId,
              deduction,
              reason,
              lastDay,
            });
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          Confirm checkout
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function TransferPopup({ tenantId }: { tenantId: string }) {
  const db = usePgStore((state) => state.db);
  const closeModal = useUiStore((state) => state.closeModal);
  const tenant = tenantById(db, tenantId);
  const beds = vacantBeds(db, tenant?.bedId ?? undefined);
  const [bedId, setBedId] = useState(beds[0]?.id ?? "");
  const [date, setDate] = useState(DEMO_TODAY);
  const [updateRent, setUpdateRent] = useState(true);
  const [error, setError] = useState("");
  if (!tenant) return null;
  return (
    <PopupFrame title={`Transfer ${tenant.name}`}>
      <div className="flex flex-col gap-3.5">
        <Field label="Move to">
          <Select value={bedId} onValueChange={setBedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bed" />
            </SelectTrigger>
            <SelectContent>
              {db.properties.map((property) => {
                const options = beds.filter(
                  (bed) => roomById(db, bed.roomId)?.propertyId === property.id,
                );
                if (!options.length) return null;
                return (
                  <SelectGroup key={property.id}>
                    <SelectLabel>{property.name}</SelectLabel>
                    {options.map((bed) => {
                      const room = roomById(db, bed.roomId);
                      return (
                        <SelectItem key={bed.id} value={bed.id}>
                          {room
                            ? `${floorName(property, room.floorKey)} · Room ${room.label} · Bed ${bed.label}`
                            : bed.label}{" "}
                          ({formatInr(bedRent(db, bed))})
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Effective date">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={updateRent}
            onCheckedChange={(value) => setUpdateRent(value === true)}
          />
          Update rent to the new room’s rate
        </label>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = await ApiService.transferTenant({
              tenantId,
              bedId,
              date,
              updateRent,
            });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          Confirm transfer
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function NoticePopup({ tenantId }: { tenantId: string }) {
  const closeModal = useUiStore((state) => state.closeModal);
  const tenant = usePgStore((state) => tenantById(state.db, tenantId));
  const [lastDay, setLastDay] = useState(addDays(DEMO_TODAY, 30));
  const [error, setError] = useState("");
  if (!tenant) return null;
  return (
    <PopupFrame title={`Notice from ${tenant.name}`}>
      <div className="flex flex-col gap-3.5">
        <Field label="Last day of stay">
          <Input
            type="date"
            value={lastDay}
            onChange={(event) => setLastDay(event.target.value)}
          />
        </Field>
        <p className="text-xs text-[var(--muted)]">
          Notice date is recorded. The bed shows as “opening soon” on the
          dashboard.
        </p>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = await ApiService.recordNotice({
              tenantId,
              lastDay,
            });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          Record notice
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function AdjustPopup({ tenantId }: { tenantId: string }) {
  const closeModal = useUiStore((state) => state.closeModal);
  const tenant = usePgStore((state) => tenantById(state.db, tenantId));
  const [kind, setKind] = useState<"charge" | "discount">("charge");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!tenant) return null;
  return (
    <PopupFrame title={`Charge or discount · ${tenant.name}`}>
      <div className="flex flex-col gap-3.5">
        <Segmented
          value={kind}
          onChange={setKind}
          label="Adjustment"
          options={[
            { value: "charge", label: "Extra charge" },
            { value: "discount", label: "Discount" },
          ]}
        />
        <Field label="Amount (₹)">
          <Input
            type="number"
            min={1}
            value={amount || ""}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </Field>
        <Field label="Note">
          <Input
            value={note}
            placeholder="e.g. Electricity share, laundry"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = await ApiService.adjustTenant({
              tenantId,
              kind,
              amount,
              note,
            });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          Apply
        </RentoButton>
      </div>
    </PopupFrame>
  );
}
