"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate page numbers window (up to 5 pages around current)
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex items-center justify-center space-x-2 py-6"
    >
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageUrl(currentPage - 1)} aria-label="Go to previous page">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Link>
        ) : (
          <span className="flex items-center text-muted-foreground opacity-50 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </span>
        )}
      </Button>

      {/* First page link if start > 1 */}
      {start > 1 && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={createPageUrl(1)}>1</Link>
          </Button>
          {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
        </>
      )}

      {/* Numbered pages */}
      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return (
          <Button
            key={p}
            variant={isCurrent ? "default" : "outline"}
            size="sm"
            aria-current={isCurrent ? "page" : undefined}
            asChild={!isCurrent}
          >
            {isCurrent ? <span>{p}</span> : <Link href={createPageUrl(p)}>{p}</Link>}
          </Button>
        );
      })}

      {/* Last page link if end < totalPages */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
          <Button variant="outline" size="sm" asChild>
            <Link href={createPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        </>
      )}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageUrl(currentPage + 1)} aria-label="Go to next page">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        ) : (
          <span className="flex items-center text-muted-foreground opacity-50 cursor-not-allowed">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </span>
        )}
      </Button>
    </nav>
  );
}
