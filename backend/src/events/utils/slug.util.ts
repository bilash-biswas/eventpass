import { PrismaService } from '../../prisma/prisma.service';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export async function generateUniqueSlug(
  prisma: PrismaService,
  title: string,
  excludeEventId?: string,
): Promise<string> {
  const baseSlug = slugify(title) || 'event';

  // Search for slugs that match baseSlug or baseSlug-*
  const existingEvents = await prisma.event.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
      ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
    },
    select: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existingEvents.map((e) => e.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}
