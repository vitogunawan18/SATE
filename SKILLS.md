# Skills Documentation - Agent Antigravity
## Bug Hunter & Bug Fixer Skills

> **Project**: FNB Talent System (Sistem Rekomendasi Penempatan Karyawan FNB)
> **Stack**: Next.js (App Router), TypeScript, Tailwind CSS
> **Last Updated**: 2026-06-08
> **Version**: 1.0

---

## 1. BUG HUNTER SKILLS

### 1.1 Code Analysis & Detection
- **Pattern Recognition**
  - Mengidentifikasi anti-patterns dalam codebase
  - Mendeteksi code smell dan technical debt
  - Recognizing memory leaks dan resource leaks

- **Static Code Analysis**
  - Menggunakan tools linting (ESLint, Pylint, SonarQube)
  - Analisis dependency vulnerability
  - Code coverage analysis

- **Dynamic Analysis**
  - Runtime behavior monitoring
  - Performance profiling dan bottleneck detection
  - Memory usage tracking

### 1.2 Testing & Reproduction
- **Test Case Design**
  - Boundary value testing
  - Edge case identification
  - Negative testing scenarios
  - Load & stress testing

- **Bug Reproduction**
  - Environment setup yang akurat
  - Step-by-step reproduction documentation
  - Minimal reproducible example (MRE) creation

- **Browser & Platform Testing**
  - Cross-browser compatibility testing
  - Responsive design testing (Mobile-First Priority)
  - OS-specific behavior verification

### 1.3 Framework-Specific Knowledge
- **Frontend Frameworks**
  - React/Next.js App Router component lifecycle bugs
  - State management issues (Zustand, Context API, Redux)
  - Rendering optimization problems (SSR, SSG, ISR, CSR)
  - Hook/Composition API pitfalls
  - Next.js-specific: Server Components vs Client Components misuse

- **Backend Frameworks**
  - Database query optimization issues
  - API Route Handler bugs & inconsistencies (Next.js App Router)
  - Middleware integration problems
  - Authentication & authorization flaws (NextAuth / Auth.js)

- **Full-Stack**
  - Database schema issues
  - API contract violations
  - Session/Cookie management bugs

### 1.4 Debugging Tools Mastery
- Browser DevTools (Chrome, Firefox, Safari)
- Node.js debugger & node inspector
- VS Code debugging capabilities
- Performance profilers & memory debuggers
- Network analysis tools (Postman, Insomnia, Fiddler)
- Log analysis & aggregation tools
- Next.js built-in error overlay & diagnostics

### 1.5 Security Vulnerability Detection
- **OWASP Top 10** awareness
  - SQL Injection vulnerabilities
  - XSS (Cross-Site Scripting) detection
  - CSRF protection gaps
  - Insecure deserialization

- **Cryptography Issues**
  - Weak encryption implementation
  - Unsafe random generation
  - Certificate validation problems

- **Access Control Flaws**
  - Authorization bypass vulnerabilities
  - Privilege escalation paths
  - Insecure direct object references (IDOR)

### 1.6 Documentation & Reporting
- **Bug Report Quality**
  - Clear title & description
  - Steps to reproduce dengan detail
  - Expected vs actual behavior
  - Screenshots/Videos/Logs
  - Severity & impact assessment

- **Root Cause Analysis**
  - Identifying underlying causes
  - Regression impact assessment
  - Related bug identification

---

## 2. BUG FIXER SKILLS

### 2.1 Root Cause Analysis
- **Code Review**
  - Logic error identification
  - Regression analysis
  - Code flow understanding

- **Debugging Methodology**
  - Binary search debugging
  - Hypothesis-driven debugging
  - Logging strategy implementation

- **System Architecture Understanding**
  - Component interactions mapping
  - Data flow analysis (Client ↔ Server ↔ DB)
  - System dependencies visualization

### 2.2 Fix Implementation
- **Code Quality Standards**
  - DRY (Don't Repeat Yourself) principle
  - SOLID principles compliance
  - Design pattern appropriate usage
  - Clean code best practices
  - TypeScript strict typing compliance

- **Testing Before Fix**
  - Write failing test cases
  - Verify test reproduces bug
  - Ensure test quality

- **Safe Implementation**
  - Minimal changes (surgical fixes)
  - Backward compatibility preservation
  - Configuration management

### 2.3 Testing & Verification
- **Unit Testing**
  - Isolated component testing
  - Edge case coverage
  - Regression test creation

- **Integration Testing**
  - Component interaction verification
  - Cross-module compatibility
  - Database integration tests

- **End-to-End Testing**
  - User workflow validation
  - Real-world scenario testing
  - Performance impact verification

- **Regression Testing**
  - Ensuring fix tidak introduce bugs baru
  - Related features verification
  - Automated test maintenance

### 2.4 Performance Optimization
- **Algorithm Optimization**
  - Time complexity reduction
  - Space complexity improvement
  - Query optimization (database)

- **Code Optimization**
  - Caching strategies (Next.js Cache, Redis)
  - Lazy loading implementation
  - Code splitting optimization
  - Image optimization dengan next/image

- **Infrastructure Issues**
  - Resource allocation problems
  - Timeout configuration
  - Concurrency issues resolution

### 2.5 Framework-Specific Fix Strategies
- **Frontend Fixes (Next.js / React)**
  - React hooks issues (useEffect deps, stale closures)
  - Component lifecycle fixes (Server vs Client Component)
  - State management corrections
  - CSS/Layout bug fixes (Mobile-First approach)
  - Hydration mismatch errors

- **Backend Fixes (Next.js API Routes)**
  - API Route Handler corrections
  - Database query optimization
  - Middleware configuration
  - Error handling implementation

- **DevOps/Infrastructure**
  - Configuration fixes (.env, next.config.ts)
  - Deployment pipeline issues
  - Environment-specific problems

### 2.6 Documentation & Knowledge Sharing
- **Fix Documentation**
  - What was the bug
  - Why it happened
  - How it was fixed
  - Why this approach
  - Prevention strategies

- **Code Comments**
  - Explaining non-obvious fixes
  - Documenting workarounds
  - Adding TODOs untuk future improvements

- **Knowledge Base Updates**
  - Common pitfall documentation
  - Best practice guidelines
  - Architecture decision records (ADR)

### 2.7 Deployment & Monitoring
- **Safe Deployment**
  - Gradual rollout strategies
  - Feature flags implementation
  - Rollback procedures

- **Post-Fix Monitoring**
  - Error rate monitoring
  - Performance metrics tracking
  - User feedback collection
  - Alert configuration

### 2.8 Collaboration Skills
- **Communication**
  - Clear fix explanation to stakeholders
  - Handling disagreements professionally
  - Status updates & transparency

- **Code Review Participation**
  - Requesting constructive feedback
  - Addressing review comments
  - Knowledge sharing dengan team

- **Cross-Team Coordination**
  - Working dengan QA teams
  - Communicating dengan product teams
  - Coordinating dengan DevOps

---

## 3. FRAMEWORK-AGNOSTIC COMPETENCIES

### 3.1 General Programming Fundamentals
- Data structures & algorithms
- Design patterns
- Object-oriented & functional programming concepts
- Concurrency & asynchronous programming

### 3.2 Version Control & Collaboration
- Git proficiency (branching, rebasing, cherry-picking)
- Code review best practices
- Commit message quality
- Conflict resolution

### 3.3 Problem-Solving Approach
- Breaking down complex problems
- Systematic troubleshooting methodology
- Creative solution thinking
- Technical decision making

### 3.4 Continuous Learning
- Staying updated dengan framework updates (Next.js changelogs)
- Learning from production incidents
- Exploring new debugging tools
- Community engagement (forums, blogs, conferences)

---

## 4. TOOLS & TECHNOLOGIES PROFICIENCY

### Essential Tools
- [x] Git & GitHub
- [x] VS Code (IDE)
- [x] Browser DevTools (Chrome Priority)
- [x] Terminal & PowerShell (Windows)
- [x] Package Managers (npm)
- [ ] Docker & Containerization

### Framework-Specific Tools
- [x] Build Tools (Webpack via Next.js, Turbopack)
- [ ] Testing Frameworks (Jest, React Testing Library, Playwright)
- [ ] CI/CD Platforms (GitHub Actions)
- [ ] Monitoring Tools (Sentry, Vercel Analytics)
- [x] API Testing Tools (Postman, Insomnia)

### Project-Specific Stack
- [x] Next.js (App Router) — **READ** `node_modules/next/dist/docs/` before coding
- [x] TypeScript — strict mode
- [x] Tailwind CSS — Mobile-First
- [x] ESLint — `eslint.config.mjs`

---

## 5. SKILL MATRIX

| Skill | Bug Hunter | Bug Fixer | Importance |
|-------|-----------|----------|-----------|
| Code Analysis | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Critical |
| Debugging | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Critical |
| Testing | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Critical |
| Root Cause Analysis | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Critical |
| Documentation | ⭐⭐⭐⭐ | ⭐⭐⭐ | High |
| Security Knowledge | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High |
| Performance Optimization | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium |
| Communication | ⭐⭐⭐ | ⭐⭐⭐⭐ | High |

---

## 6. LEARNING PATH RECOMMENDATIONS

### For Bug Hunters
1. Master debugging tools & techniques
2. Learn common vulnerability patterns (OWASP)
3. Study framework-specific pitfalls (Next.js App Router)
4. Practice test case design
5. Develop reporting & documentation skills

### For Bug Fixers
1. Understand system architecture deeply (FNB Talent System domain)
2. Master testing frameworks (Jest + Playwright)
3. Learn performance profiling (Next.js Profiler, Chrome DevTools)
4. Practice safe refactoring (TypeScript-safe)
5. Develop deployment strategies (Vercel / self-hosted)

---

## 7. SUCCESS METRICS

### Bug Hunter KPIs
- Detection accuracy rate
- False positive ratio (minimize)
- Bug severity distribution
- Time to report
- Bug report quality score

### Bug Fixer KPIs
- Fix success rate (first-time-right)
- Regression rate (minimize)
- Time to fix
- Code review approval rate
- Production incident reduction

---

## 8. PROJECT-SPECIFIC RULES (FNB Talent System)

> These rules apply on top of the general skills above and are specific to this codebase.

### 8.1 Mobile-First Mandatory
- Semua UI fixes harus dimulai dari breakpoint mobile
- Gunakan Tailwind responsive prefixes: `sm:`, `md:`, `lg:` setelah mobile baseline solid
- Jangan fix desktop layout tanpa memastikan mobile tidak broken

### 8.2 Always Test After Every Feature/Fix
- Setelah setiap bug fix, jalankan `npm run dev` dan verifikasi di browser
- Uji di viewport 375px (mobile) sebelum viewport desktop
- Dokumentasikan hasil test di commit message

### 8.3 Next.js App Router Awareness
- Baca `node_modules/next/dist/docs/` sebelum menyentuh routing atau server components
- Jangan gunakan Pages Router API (getServerSideProps, getStaticProps) — ini App Router project
- Pahami perbedaan Server Component dan Client Component sebelum debugging

### 8.4 TypeScript Strict Mode
- Semua fixes harus type-safe, tidak ada `any` kecuali benar-benar diperlukan
- Gunakan proper interface/type definitions
- Jalankan `npx tsc --noEmit` untuk validasi sebelum commit

### 8.5 Query context7 When Uncertain
- Jika ragu tentang API Next.js, query MCP server `context7` terlebih dahulu
- Jangan asumsi behavior Next.js berdasarkan training data lama

---

**Last Updated**: 2026-06-08
**Version**: 1.0
**Maintained By**: Agent Antigravity Team
**Project**: FNB Talent System
