import Link from "next/link";
import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Ticket className="h-4 w-4 rotate-[-15deg]" />
            </div>
            <span className="font-semibold text-foreground">EventPass</span>
            <span className="text-xs">· Production Ticketing Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <Link href="/events" className="hover:text-foreground transition-colors">
              Browse Events
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Organizer Portal
            </Link>
            <a
              href="http://localhost:3000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              API Swagger
            </a>
          </div>

          <p className="text-xs">
            &copy; {new Date().getFullYear()} EventPass. Built with Next.js & NestJS.
          </p>
        </div>
      </div>
    </footer>
  );
}
