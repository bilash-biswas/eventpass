"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Calendar, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const sort = searchParams.get("sort") || "asc";
  const from = searchParams.get("from") || "";

  // Check if any active filters are applied
  const hasActiveFilters = Boolean(
    searchParams.get("search") || searchParams.get("sort") || searchParams.get("from") || searchParams.get("to"),
  );

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page to 1 on filter changes
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/events?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: search.trim() || null });
  };

  const handleClearFilters = () => {
    setSearch("");
    router.push("/events");
  };

  const handleDatePreset = (preset: "all" | "upcoming" | "today" | "month") => {
    const now = new Date();
    if (preset === "all") {
      applyFilters({ from: null, to: null });
    } else if (preset === "upcoming") {
      applyFilters({ from: now.toISOString(), to: null });
    } else if (preset === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      applyFilters({ from: startOfDay, to: endOfDay });
    } else if (preset === "month") {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      applyFilters({ from: now.toISOString(), to: endOfMonth });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events by title or location (e.g. San Francisco, Tech Summit)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-20"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 text-xs"
          >
            Search
          </Button>
        </form>

        {/* Sort and Clear Actions */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center rounded-lg border bg-background px-2.5 py-1 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-muted-foreground mr-1">Sort:</span>
            <select
              value={sort}
              onChange={(e) => applyFilters({ sort: e.target.value })}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="asc">Soonest first</option>
              <option value="desc">Furthest first</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Date Filter Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t text-xs">
        <span className="text-muted-foreground flex items-center mr-1">
          <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
          Quick Filters:
        </span>

        <button
          type="button"
          onClick={() => handleDatePreset("all")}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            !from
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Dates
        </button>

        <button
          type="button"
          onClick={() => handleDatePreset("upcoming")}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            from && !searchParams.get("to")
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Upcoming Only
        </button>

        <button
          type="button"
          onClick={() => handleDatePreset("month")}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            searchParams.get("to")
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          This Month
        </button>
      </div>
    </div>
  );
}
