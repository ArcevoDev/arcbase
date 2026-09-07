# Arcbase

Next.js 15 knowledge-graph application. Auth delegated to [arc-id](https://github.com/ArcevoDev/arc-id) (Fastify identity service).

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: arc-id (external identity service)
- **Storage**: S3-compatible (AWS S3 / Cloudflare R2)
- **UI**: shadcn/ui + Tailwind CSS v4

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

See [docs/architecture.md](./docs/architecture.md) and [docs/arcbase-roadmap.md](./docs/arcbase-roadmap.md) for the full architecture and rebuild plan.

### Route Handler Pattern

API routes follow a consistent pattern:

```typescript
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = handleApiRoute(async (req, { params }) => {
  const session = await requireAuth(req);
  return NextResponse.json({ success: true, data: result });
});
```

### Domain Structure

Business logic lives in `src/domains/` following a flows/services/repositories pattern:

```
domains/{name}/
  {name}.dto.ts          — Zod schemas + types
  {name}.service.ts      — Business logic / orchestration
  {name}.repository.ts   — Database access
  flows/
    {action}.flow.ts     — Composable action flows
```

### Import Rules

| Import | Must be from | Never from |
|--------|-------------|------------|
| Auth guards | `@/core/auth` | `@/lib/arcid/middleware` |
| Error handling | `@/lib/errors` | individual files |
| Prisma | `@/core/db` | relative paths |
| Flows | `@/core/flows` | individual flow files |
| arc-id SDK | `@/lib/arcid` | individual client files |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Prettier formatting |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
