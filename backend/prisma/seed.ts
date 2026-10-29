import { PrismaClient, Role, TicketStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateTicketCode(): string {
  return `TKT_${randomBytes(20).toString('hex')}`;
}

async function main(): Promise<void> {
  console.log('[Seed] Seeding database...');

  const passwordHash = await argon2.hash('Password123!');

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eventpass.io' },
    update: { passwordHash },
    create: {
      email: 'admin@eventpass.io',
      name: 'Platform Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2. Create Organizer User
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventpass.io' },
    update: { passwordHash },
    create: {
      email: 'organizer@eventpass.io',
      name: 'Sarah Connor (Events Director)',
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  // 3. Create Regular Users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@eventpass.io' },
    update: { passwordHash },
    create: {
      email: 'user1@eventpass.io',
      name: 'Alice Johnson',
      passwordHash,
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@eventpass.io' },
    update: { passwordHash },
    create: {
      email: 'user2@eventpass.io',
      name: 'Bob Smith',
      passwordHash,
      role: Role.USER,
    },
  });

  console.log('[Seed] Users seeded:');
  console.log(`  - Admin: ${admin.email} (Role: ${admin.role})`);
  console.log(`  - Organizer: ${organizer.email} (Role: ${organizer.role})`);
  console.log(`  - User 1: ${user1.email} (Role: ${user1.role})`);
  console.log(`  - User 2: ${user2.email} (Role: ${user2.role})`);

  // 4. Create Sample Events
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const event1 = await prisma.event.upsert({
    where: { slug: 'global-tech-summit-2026' },
    update: {},
    create: {
      slug: 'global-tech-summit-2026',
      title: 'Global Tech Summit 2026',
      description:
        'The premier conference exploring distributed systems, modern cloud infrastructure, NestJS, Flutter, and Next.js at scale.',
      location: 'Moscone West Convention Center, San Francisco, CA',
      startsAt: new Date(now + 14 * oneDay),
      endsAt: new Date(now + 16 * oneDay),
      capacity: 500,
      coverImageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      status: 'PUBLISHED',
      organizerId: organizer.id,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { slug: 'nextjs-and-flutter-fullstack-masterclass' },
    update: {},
    create: {
      slug: 'nextjs-and-flutter-fullstack-masterclass',
      title: 'Next.js and Flutter Fullstack Masterclass',
      description:
        'Hands-on workshop teaching production-grade typed API integration, offline-first mobile architecture, and server-side rendering.',
      location: 'Downtown Tech Hub, Austin, TX & Online Stream',
      startsAt: new Date(now + 7 * oneDay),
      endsAt: new Date(now + 7 * oneDay + 6 * 60 * 60 * 1000),
      capacity: 60,
      coverImageUrl:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      status: 'PUBLISHED',
      organizerId: organizer.id,
    },
  });

  const event3 = await prisma.event.upsert({
    where: { slug: 'exclusive-ai-engineering-retreat' },
    update: {},
    create: {
      slug: 'exclusive-ai-engineering-retreat',
      title: 'Exclusive AI Engineering Retreat',
      description:
        'Intimate gathering of senior system architects and AI researchers. Strict capacity limit of 2 attendees.',
      location: 'Mountain Lodge Retreat, Aspen, CO',
      startsAt: new Date(now + 21 * oneDay),
      endsAt: new Date(now + 23 * oneDay),
      capacity: 2,
      coverImageUrl:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
      status: 'PUBLISHED',
      organizerId: organizer.id,
    },
  });

  const event4 = await prisma.event.upsert({
    where: { slug: 'zero-trust-cloud-security-symposium' },
    update: {},
    create: {
      slug: 'zero-trust-cloud-security-symposium',
      title: 'Zero Trust Cloud Security Symposium',
      description:
        'Draft event covering defense-in-depth, token rotation, and row-level database serialization.',
      location: 'Hyatt Regency, Chicago, IL',
      startsAt: new Date(now + 30 * oneDay),
      endsAt: new Date(now + 31 * oneDay),
      capacity: 150,
      coverImageUrl:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
      status: 'DRAFT',
      organizerId: organizer.id,
    },
  });

  console.log('[Seed] Events seeded:');
  console.log(
    `  - ${event1.title} (${event1.status}, Capacity: ${event1.capacity})`,
  );
  console.log(
    `  - ${event2.title} (${event2.status}, Capacity: ${event2.capacity})`,
  );
  console.log(
    `  - ${event3.title} (${event3.status}, Capacity: ${event3.capacity})`,
  );
  console.log(
    `  - ${event4.title} (${event4.status}, Capacity: ${event4.capacity})`,
  );

  // 5. Create Sample Tickets
  const ticket1 = await prisma.ticket.upsert({
    where: {
      eventId_userId: {
        eventId: event1.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      code: generateTicketCode(),
      status: TicketStatus.VALID,
      eventId: event1.id,
      userId: user1.id,
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: {
      eventId_userId: {
        eventId: event3.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      code: generateTicketCode(),
      status: TicketStatus.CHECKED_IN,
      checkedInAt: new Date(),
      eventId: event3.id,
      userId: user2.id,
    },
  });

  console.log('[Seed] Sample Tickets seeded:');
  console.log(
    `  - Ticket for ${user1.email} at "${event1.title}": Code: ${ticket1.code} (Status: ${ticket1.status})`,
  );
  console.log(
    `  - Ticket for ${user2.email} at "${event3.title}": Code: ${ticket2.code} (Status: ${ticket2.status})`,
  );

  console.log('[Seed] Database seeding completed successfully! ✨');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
