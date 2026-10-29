"use client";

import * as React from "react";
import {
  CheckCircle2,
  CheckCheck,
  Clock,
  Download,
  Mail,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/date";
import type { components } from "@/lib/api/schema";

type Attendee = components["schemas"]["AttendeeResponseDto"];

interface AttendeeRosterProps {
  attendees: Attendee[];
  eventSlug: string;
}

export function AttendeeRoster({
  attendees,
  eventSlug,
}: AttendeeRosterProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Filter attendees
  const filtered = attendees.filter((a) => {
    const matchesSearch =
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // RFC 4180 compliant CSV Export
  const handleExportCsv = () => {
    const headers = ["Ticket Code", "Name", "Email", "RSVP Date", "Status", "Checked-in At"];

    const escapeCsv = (val?: string | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = attendees.map((a) => {
      const checkedInTime = a.checkedInAt ? String(a.checkedInAt) : "N/A";
      return [
        escapeCsv(a.code),
        escapeCsv(a.user.name),
        escapeCsv(a.user.email),
        escapeCsv(a.createdAt),
        escapeCsv(a.status),
        escapeCsv(checkedInTime),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EventPass-Attendees-${eventSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Filter and Export Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Statuses ({attendees.length})</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="VALID">Valid / Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={attendees.length === 0}
            className="h-9 text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3.5 pl-4">Attendee</th>
                <th className="p-3.5">Ticket Code</th>
                <th className="p-3.5">RSVP Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4">Checked-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No attendees match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.ticketId} className="hover:bg-muted/30 transition-colors">
                    {/* Attendee Name & Email */}
                    <td className="p-3.5 pl-4">
                      <div className="font-semibold text-foreground flex items-center space-x-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span>{a.user.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center space-x-1 mt-0.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{a.user.email}</span>
                      </div>
                    </td>

                    {/* Ticket Code */}
                    <td className="p-3.5 font-mono text-[11px] text-foreground font-semibold">
                      <span className="bg-muted px-2 py-1 rounded border">{a.code}</span>
                    </td>

                    {/* RSVP Time */}
                    <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(a.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      {a.status === "CHECKED_IN" ? (
                        <Badge className="bg-sky-600 hover:bg-sky-600 text-white space-x-1">
                          <CheckCheck className="h-3 w-3" />
                          <span>Checked In</span>
                        </Badge>
                      ) : a.status === "CANCELLED" ? (
                        <Badge variant="destructive" className="space-x-1">
                          <XCircle className="h-3 w-3" />
                          <span>Cancelled</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Valid</span>
                        </Badge>
                      )}
                    </td>

                    {/* Checked-In Timestamp */}
                    <td className="p-3.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {a.checkedInAt ? (
                        <span className="flex items-center text-sky-700 dark:text-sky-400 font-medium">
                          <Clock className="h-3 w-3 mr-1" />
                          {String(a.checkedInAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
