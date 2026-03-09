# Batman

This project was created with [Better Fullstack](https://github.com/Marve10s/Better-Fullstack), a modern TypeScript stack that combines Next.js, Self, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - CSS framework
- **shadcn/ui** - UI components
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better Auth
- **Turborepo** - Optimized monorepo build system

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Batman
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file inside the `apps/web/` directory:

```bash
touch apps/web/.env
```

Add the following variables to `apps/web/.env`:

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=
DIRECT_URL=
```

Fill in the values:

- **`BETTER_AUTH_SECRET`** — Generate a random secret string (you can use `openssl rand -base64 32`).
- **`BETTER_AUTH_URL`** — The URL your app runs on locally (`http://localhost:3001`).
- **`CORS_ORIGIN`** — Same as above.
- **`DATABASE_URL`** — Your Supabase **Transaction** connection string (found under Project Settings > Database > Connection string > Transaction mode). It typically uses port `6543` and includes `?pgbouncer=true`.
- **`DIRECT_URL`** — Your Supabase **Session** connection string (found under Project Settings > Database > Connection string > Session mode). It typically uses port `5432`.

### 4. Set up the database

Generate the Prisma client and push the schema to your database:

```bash
pnpm run db:generate
pnpm run db:push
```

### 5. Run the development server

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. If everything is working, you now have a fully functional full-stack boilerplate ready to go.

### 6. Start vibe coding

Hand the project off to your favorite AI-powered IDE — [Cursor](https://cursor.com), [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Antigravity](https://antigravity.dev), [Codex](https://openai.com/index/codex), or any tool you prefer — and start building.

## Project Structure

```
Batman/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:generate`: Generate the Prisma client
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:studio`: Open database studio UI
