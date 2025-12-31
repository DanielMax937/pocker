# Repository Guidelines

## Project Structure & Modules
- Next.js App Router app in `app/` (pages, routes, UI components).
- Shared utilities and Prisma client helper in `lib/`.
- Database schema and migrations in `prisma/` (SQLite dev DB checked in as `dev.db`).
- Static assets in `public/`; global styles and Tailwind setup in `app/globals.css`.

## Build, Test, and Development
- `npm run dev` – Start the Next.js dev server with Turbopack.
- `npm run build` – Create a production build.
- `npm start` – Run the production server (after `npm run build`).
- `npm run lint` – Run ESLint with the Next.js + TypeScript config.
- Prisma helpers: `npx prisma migrate dev`, `npx prisma migrate reset`, `npx prisma db push`, `npx prisma generate`.

## Coding Style & Naming
- Use TypeScript with ES modules and React functional components.
- Follow Next.js conventions for route files in `app/` (e.g., `page.tsx`, `route.ts`).
- Prefer descriptive camelCase for variables/functions and PascalCase for React components and files in `app/components/`.
- Keep formatting consistent with the existing code; run `npm run lint` before opening a PR.

## Testing Guidelines
- There is currently no dedicated automated test suite; prefer small, well-factored functions and manual verification through the UI and API routes.
- When adding tests, follow common Next.js/TypeScript practices and colocate tests near the code or in a `__tests__/` folder.

## Commit & Pull Request Guidelines
- Existing history uses short, conventional messages like `feat: update`; prefer `type: summary` format (e.g., `feat: add game replay`, `fix: handle all-in edge cases`).
- Keep commits focused and logically grouped.
- For PRs, include a short description, relevant screenshots for UI changes, and links to any related issues.
