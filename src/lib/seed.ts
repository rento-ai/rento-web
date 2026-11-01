import {
  BedStyleEnum,
  ComplaintStatusEnum,
  DepositKindEnum,
  PaymentStatusEnum,
  TenantStatusEnum,
} from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import { DEMO_PASSWORD, nowLabel } from "@/lib/constants";
import type { PgDatabase, TenantModel } from "@/models/pg.model";

function placeholderPhoto(label: string, color: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${color}"/><rect x="40" y="260" width="320" height="60" rx="12" fill="${accent}"/><circle cx="200" cy="150" r="60" fill="${accent}" opacity=".6"/><text x="200" y="298" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function emptyDatabase(): PgDatabase {
  return {
    seq: 500,
    properties: [],
    rooms: [],
    beds: [],
    tenants: [],
    users: [],
    charges: [],
    payments: [],
    deposits: [],
    complaints: [],
    notifications: [],
    announcements: [],
    audit: [],
    settings: { staffPay: true, staffPrivate: false, upi: "sunrise.pg@upi" },
    receiptCounter: 120,
  };
}

export function seed(): PgDatabase {
  const db = emptyDatabase();
  db.properties = [
    {
      id: "p1",
      name: "Sunrise Residency",
      area: "Kondapur",
      bedStyle: BedStyleEnum.alpha,
      floors: [{ key: "2", label: "Floor 2" }],
    },
    {
      id: "p2",
      name: "Lakeview Gents PG",
      area: "Madhapur",
      bedStyle: BedStyleEnum.alpha,
      floors: [{ key: "1", label: "Floor 1" }],
    },
  ];

  const layout: [string, string, number, number][] = [
    ["p1", "201", 2, 8500],
    ["p1", "202", 3, 7000],
    ["p1", "203", 4, 6000],
    ["p1", "204", 3, 7500],
    ["p1", "205", 2, 8500],
    ["p1", "206", 4, 6000],
    ["p1", "207", 3, 6500],
    ["p1", "208", 2, 8500],
    ["p2", "101", 3, 7000],
    ["p2", "102", 3, 7000],
    ["p2", "103", 2, 8000],
    ["p2", "104", 4, 6500],
  ];

  for (const [propertyId, label, bedCount, rent] of layout) {
    const roomId = `r${label}`;
    db.rooms.push({
      id: roomId,
      propertyId,
      label,
      floorKey: label.charAt(0),
      type: rent >= 8000 ? "AC" : "Non-AC",
      rent,
      archived: false,
    });
    for (let index = 0; index < bedCount; index += 1) {
      const bedLabel = "ABCD"[index] ?? "A";
      db.beds.push({
        id: `${roomId}-${bedLabel}`,
        roomId,
        label: bedLabel,
        rentOverride: null,
        outOfService: false,
      });
    }
  }

  const vacant = new Set([
    "r202-C",
    "r203-C",
    "r203-D",
    "r205-A",
    "r205-B",
    "r104-C",
    "r104-D",
    "r102-C",
  ]);
  const featured: Record<string, string> = {
    "r204-B": "Karthik Reddy",
    "r202-B": "Sneha Patel",
    "r207-B": "Divya Nair",
    "r206-A": "Mohammed Irfan",
    "r203-A": "Arjun Rao",
    "r207-A": "Lakshmi Prasad",
  };
  const generated = [
    "Ananya Rao",
    "Vikram Kumar",
    "Rohit Sharma",
    "Tarun Mehta",
    "Harsha Bhat",
    "Priya Singh",
    "Gaurav Lal",
    "Manoj Reddy",
    "Shruti Bansal",
    "Akash Kulkarni",
    "Bhavna Verma",
    "Nikhil Kapoor",
    "Jyoti Das",
    "Pranav Shah",
    "Meera Iyer",
    "Sandeep Rao",
    "Kiran Kumar",
    "Pooja Nair",
    "Rahul Jain",
    "Sai Teja",
    "Varun Goud",
    "Naveen Chary",
    "Imran Khan",
    "Deepak Yadav",
  ];

  db.users.push({
    id: "u_owner",
    email: "raju@demo.in",
    password: DEMO_PASSWORD,
    name: "Raju",
    role: RoleEnum.owner,
  });
  db.users.push({
    id: "u_staff",
    email: "anita@demo.in",
    password: DEMO_PASSWORD,
    name: "Anita (Warden)",
    role: RoleEnum.staff,
    propertyId: "p1",
  });

  let nameIndex = 0;
  let count = 0;
  for (const bed of db.beds) {
    if (vacant.has(bed.id)) continue;
    const name = featured[bed.id] ?? generated[nameIndex++];
    if (!name) continue;
    count += 1;
    const room = db.rooms.find((item) => item.id === bed.roomId);
    if (!room) continue;
    const tenant: TenantModel = {
      id: `t${count}`,
      name,
      phone: `98${String(10000000 + count * 3137921).slice(-8)}`,
      email: `${name.split(" ")[0]?.toLowerCase()}${featured[bed.id] ? "" : count}@demo.in`,
      bedId: bed.id,
      rent: room.rent,
      deposit: room.rent * 2,
      start: `2026-0${3 + (count % 6)}-${String(3 + (count % 20)).padStart(2, "0")}`,
      dueDay: 5,
      status: TenantStatusEnum.active,
      credit: 0,
      history: [],
    };
    if (name === "Karthik Reddy") {
      tenant.email = "karthik@demo.in";
      tenant.start = "2026-06-12";
      tenant.status = TenantStatusEnum.notice;
      tenant.vacate = "2026-11-18";
    }
    if (name === "Arjun Rao") tenant.dueDay = 11;
    if (name === "Sneha Patel") tenant.email = "sneha@demo.in";
    db.tenants.push(tenant);
    db.users.push({
      id: `u_${tenant.id}`,
      email: tenant.email,
      password: DEMO_PASSWORD,
      name: tenant.name,
      role: RoleEnum.tenant,
      tenantId: tenant.id,
    });
    db.deposits.push({
      id: `d${count}`,
      tenantId: tenant.id,
      kind: DepositKindEnum.collected,
      amount: tenant.deposit,
      note: "Collected at check-in",
      date: tenant.start,
    });
  }

  const methods = ["UPI", "Cash", "Bank"];
  const unpaid = new Set([
    "Karthik Reddy",
    "Sneha Patel",
    "Mohammed Irfan",
    "Arjun Rao",
  ]);
  let seen = 0;
  db.tenants.forEach((tenant, index) => {
    const october: PgDatabase["charges"][number] = {
      id: `c${++db.seq}`,
      tenantId: tenant.id,
      type: "Rent",
      month: "Oct 2026",
      amount: tenant.rent,
      due: "2026-10-05",
    };
    db.charges.push(october);
    const octoberPaid = tenant.rent;
    db.payments.push({
      id: `pay${++db.seq}`,
      tenantId: tenant.id,
      amount: octoberPaid,
      method: methods[index % 3] ?? "UPI",
      reference:
        methods[index % 3] === "UPI"
          ? String(300000000000 + db.seq * 7919)
          : "",
      date: `2026-10-0${2 + (index % 4)}`,
      status: PaymentStatusEnum.confirmed,
      by: "Raju",
      receiptNo: `RC-${String(++db.receiptCounter).padStart(5, "0")}`,
      allocations: [{ chargeId: october.id, amount: octoberPaid }],
    });

    const november: PgDatabase["charges"][number] = {
      id: `c${++db.seq}`,
      tenantId: tenant.id,
      type: "Rent",
      month: "Nov 2026",
      amount: tenant.rent,
      due: `2026-11-${String(tenant.dueDay).padStart(2, "0")}`,
    };
    db.charges.push(november);
    if (tenant.name === "Divya Nair") {
      db.payments.push({
        id: `pay${++db.seq}`,
        tenantId: tenant.id,
        amount: 3000,
        method: "UPI",
        reference: String(300000000000 + db.seq * 7919),
        date: "2026-11-03",
        status: PaymentStatusEnum.confirmed,
        by: "Raju",
        receiptNo: `RC-${String(++db.receiptCounter).padStart(5, "0")}`,
        allocations: [{ chargeId: november.id, amount: 3000 }],
      });
      return;
    }
    if (unpaid.has(tenant.name)) return;
    if (tenant.name === "Lakshmi Prasad") {
      db.payments.push({
        id: `pay${++db.seq}`,
        tenantId: tenant.id,
        amount: tenant.rent,
        method: "UPI",
        reference: String(300000000000 + db.seq * 7919),
        date: "2026-11-03",
        status: PaymentStatusEnum.confirmed,
        by: "Raju",
        receiptNo: `RC-${String(++db.receiptCounter).padStart(5, "0")}`,
        allocations: [{ chargeId: november.id, amount: tenant.rent }],
      });
      return;
    }
    seen += 1;
    if (seen % 7 === 3) return;
    db.payments.push({
      id: `pay${++db.seq}`,
      tenantId: tenant.id,
      amount: tenant.rent,
      method: methods[(index + 1) % 3] ?? "Cash",
      reference:
        methods[(index + 1) % 3] === "UPI"
          ? String(300000000000 + db.seq * 7919)
          : "",
      date: `2026-11-0${2 + (index % 5)}`,
      status: PaymentStatusEnum.confirmed,
      by: "Raju",
      receiptNo: `RC-${String(++db.receiptCounter).padStart(5, "0")}`,
      allocations: [{ chargeId: november.id, amount: tenant.rent }],
    });
  });

  const tenantId = (name: string) =>
    db.tenants.find((tenant) => tenant.name === name)?.id ?? "";
  db.complaints = [
    {
      id: "k1",
      tenantId: tenantId("Karthik Reddy"),
      category: "Maintenance",
      title: "Tap leaking in bathroom",
      description: "The bathroom tap keeps dripping and wastes water.",
      photos: [placeholderPhoto("Leaking tap", "#5C7D8A", "#2F4B57")],
      urgent: false,
      isPrivate: false,
      status: ComplaintStatusEnum.Closed,
      assignee: "Ramesh (Plumber)",
      created: "2026-11-01",
      events: [
        { at: "1 Nov, 09:10", text: "Raised by Karthik Reddy" },
        { at: "1 Nov, 11:00", text: "Assigned to Ramesh (Plumber)" },
        { at: "2 Nov, 17:30", text: "Marked resolved" },
        { at: "3 Nov, 08:00", text: "Confirmed fixed by tenant" },
      ],
      messages: [
        {
          by: "Anita (Warden)",
          role: RoleEnum.staff,
          text: "Plumber will visit tomorrow morning.",
          at: "1 Nov, 11:00",
        },
      ],
    },
    {
      id: "k2",
      tenantId: tenantId("Karthik Reddy"),
      category: "Maintenance",
      title: "Wi-Fi not working in room",
      description: "No internet since last night. Router lights are red.",
      photos: [placeholderPhoto("Router red light", "#7A5C8A", "#4A2F57")],
      urgent: false,
      isPrivate: false,
      status: ComplaintStatusEnum.InProgress,
      assignee: "Anita (Warden)",
      created: "2026-11-08",
      events: [
        { at: "8 Nov, 10:20", text: "Raised by Karthik Reddy" },
        { at: "8 Nov, 12:00", text: "Acknowledged" },
        { at: "9 Nov, 09:00", text: "Assigned to Anita (Warden)" },
      ],
      messages: [
        {
          by: "Anita (Warden)",
          role: RoleEnum.staff,
          text: "Restarted the router, checking the line with the provider.",
          at: "9 Nov, 09:05",
        },
      ],
    },
    {
      id: "k3",
      tenantId: tenantId("Sneha Patel"),
      category: "Cleanliness",
      title: "Bathroom not cleaned for 3 days",
      description:
        "Floor 2 common bathroom has not been cleaned since Saturday.",
      photos: [placeholderPhoto("Dirty bathroom", "#8A7A5C", "#57492F")],
      urgent: false,
      isPrivate: false,
      status: ComplaintStatusEnum.Open,
      assignee: "",
      created: "2026-11-09",
      events: [{ at: "9 Nov, 07:45", text: "Raised by Sneha Patel" }],
      messages: [],
    },
    {
      id: "k4",
      tenantId: tenantId("Divya Nair"),
      category: "Roommate",
      title: "Loud music late at night",
      description:
        "Roommate plays loud music after midnight even after I asked politely.",
      photos: [],
      urgent: false,
      isPrivate: true,
      status: ComplaintStatusEnum.Open,
      assignee: "",
      created: "2026-11-07",
      events: [{ at: "7 Nov, 23:40", text: "Raised by Divya Nair (private)" }],
      messages: [],
    },
    {
      id: "k5",
      tenantId: tenantId("Mohammed Irfan"),
      category: "Safety / urgent",
      title: "Water leaking from ceiling",
      description: "Water is dripping near the switchboard in my room.",
      photos: [placeholderPhoto("Ceiling leak", "#5C8A6D", "#2F5740")],
      urgent: true,
      isPrivate: false,
      status: ComplaintStatusEnum.Acknowledged,
      assignee: "Ramesh (Plumber)",
      created: "2026-11-09",
      events: [
        { at: "9 Nov, 06:30", text: "Raised as urgent by Mohammed Irfan" },
        { at: "9 Nov, 06:40", text: "Acknowledged" },
      ],
      messages: [],
    },
  ];

  db.announcements = [
    {
      id: "a1",
      title: "Water supply off on Sunday",
      body: "Water supply will be off 10 AM to 1 PM this Sunday for tank cleaning.",
      date: "2026-11-08",
    },
    {
      id: "a2",
      title: "Rent due by the 5th",
      body: "Please pay monthly rent by the 5th. Share the UTR after paying by UPI.",
      date: "2026-11-01",
    },
  ];
  db.notifications = [
    {
      id: "n1",
      to: "owner",
      text: "Mohammed Irfan raised an urgent complaint: Water leaking from ceiling",
      link: "complaints",
      read: false,
      at: "9 Nov, 06:30",
    },
    {
      id: "n2",
      to: "staff",
      text: "New complaint: Bathroom not cleaned for 3 days",
      link: "complaints",
      read: false,
      at: "9 Nov, 07:45",
    },
    {
      id: "n3",
      to: `t:${tenantId("Karthik Reddy")}`,
      text: "Your Wi-Fi complaint is now In progress",
      link: "complaints",
      read: false,
      at: "9 Nov, 09:00",
    },
  ];
  db.audit = [
    {
      at: "1 Nov, 08:00",
      by: "System",
      text: "Generated Nov 2026 rent for 27 tenants",
    },
  ];
  return db;
}

export function seedEmpty(input: {
  name: string;
  email: string;
  password: string;
  pgName: string;
  area: string;
}): PgDatabase {
  const db = emptyDatabase();
  db.receiptCounter = 0;
  db.settings.upi = "yourpg@upi";
  db.properties = [
    {
      id: "p1",
      name: input.pgName,
      area: input.area,
      bedStyle: BedStyleEnum.alpha,
      floors: [],
    },
  ];
  db.users = [
    {
      id: "u_owner",
      email: input.email,
      password: input.password,
      name: input.name,
      role: RoleEnum.owner,
    },
  ];
  db.audit = [
    { at: nowLabel(), by: "System", text: `Created ${input.pgName}` },
  ];
  return db;
}
