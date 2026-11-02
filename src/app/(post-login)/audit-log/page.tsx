"use client";

import { Card } from "@/components/card";
import usePgStore from "@/store/usePg.store";

export default function AuditLogPage() {
  const audit = usePgStore((state) => state.db.audit);
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
            <th className="pb-2 font-semibold">When</th>
            <th className="pb-2 font-semibold">Who</th>
            <th className="pb-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {audit.slice(0, 60).map((item) => (
            <tr
              key={`${item.at}-${item.text}`}
              className="border-t border-[var(--line)]"
            >
              <td className="py-2.5 whitespace-nowrap">{item.at}</td>
              <td className="py-2.5">{item.by}</td>
              <td className="py-2.5">{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
