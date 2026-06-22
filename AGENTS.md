<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:skills-rules -->
# Bug Hunter & Bug Fixer Skills

Read `SKILLS.md` before performing any debugging, bug fixing, or code analysis task in this project. The skills documentation defines:
- How to identify and analyze bugs (Bug Hunter Skills)
- How to safely implement fixes (Bug Fixer Skills)
- Project-specific rules for the FNB Talent System (Section 8)

Key mandatory rules from SKILLS.md:
1. Mobile-First: Always fix mobile layout before desktop
2. Test after every fix: Run `npm run dev` and verify at 375px viewport
3. Next.js App Router only — no Pages Router APIs
4. TypeScript strict mode — run `npx tsc --noEmit` before committing
5. Query `context7` MCP server when uncertain about Next.js APIs

## Available Slash Commands (Skills)
- `/bug-hunt` — Aktivasi Bug Hunter Mode: analisis mendalam untuk menemukan bug, anti-patterns, dan security vulnerabilities
- `/bug-fix`  — Aktivasi Bug Fixer Mode: implementasi fix yang aman, minimal, dan terdokumentasi
<!-- END:skills-rules -->

