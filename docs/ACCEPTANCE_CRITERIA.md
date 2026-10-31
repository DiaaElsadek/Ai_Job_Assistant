# JobFlow AI — Quality Assurance & Acceptance Criteria

**Document ID:** `docs/ACCEPTANCE_CRITERIA.md`  
**Status:** Approved Quality Standard — aligned to `docs/EXECUTION_STRATEGY.md` v3.0  
**Version:** 3.0  
**Author:** Principal QA Architect & Senior Full-Stack Engineer  

> **How to use this document.** A milestone is accepted only when every functional checkbox in its section is true **and** its measurable targets are met. Checkboxes are binary; metrics require evidence (test output, query, log, or screenshot) attached to the PR. “Works on my machine” is not evidence.

---

## 1. M0A — Security & Migration Baseline

### Functional

- [ ] `safeFetch` rejects non-HTTP(S) protocols with `INVALID_PROTOCOL`.
- [ ] `safeFetch` rejects loopback, RFC 1918, link-local, CGNAT, unique-local IPv6, and cloud metadata destinations.
- [ ] `safeFetch` normalizes and rejects IPv4-mapped IPv6 (`::ffff:127.0.0.1`, `::ffff:7f00:1`) and NAT64 (`64:ff9b::/96`) forms.
- [ ] DNS validation and the actual connection use the **same pinned IP**; a resolver that changes its answer between calls cannot redirect the request.
- [ ] Redirects are re-validated; a public URL redirecting to a private IP is blocked; max redirects enforced.
- [ ] A chunked response without `Content-Length` aborts at `maxBytes` with `TOO_LARGE`.
- [ ] Disallowed content types are rejected with `BAD_CONTENT_TYPE`.
- [ ] Timeouts abort with `TIMEOUT`; the user sees a safe message, not an internal IP.
- [ ] The existing job-URL importer still works for a public URL.
- [ ] CI runs typecheck, tests, lint baseline, `prisma validate`, and the migration drift gate.
- [ ] The drift gate fails on a deliberately introduced schema/migration mismatch.
- [ ] `.env.example` is tracked and includes `SHADOW_DATABASE_URL`, `AI_API_KEY`, `GEMINI_API_KEY`, `AI_MODEL`, and `QUEUE_ENABLED=false`.
- [ ] No new business tables; no production queue wiring.

### Metrics

| Metric | Target | Evidence |
|---|---|---|
| Security tests passing | 100% | CI log |
| SSRF bypass cases | 0 | Test matrix |
| Migration drift detection | Fails as expected | Branch demonstrating failure |
| Typecheck / lint | 0 errors (no new lint errors) | CI log |

---

## 2. M1 — Career Profile & Skills

### Functional

- [ ] User can create and update a `UserProfile` with headline, summary, years of experience, target seniority, target roles, target countries, EGP/USD salary floors, and preferred work modes.
- [ ] User can add, edit, and remove `UserSkill` rows with category, proficiency, years, and top-skill flag.
- [ ] Duplicate skill names for the same profile are rejected or merged.
- [ ] Profile completeness is shown; discovery is disabled until at least one target role, one country, one work mode, and three skills exist.
- [ ] If no `UserProfile` exists, the form is prefilled from `Settings` as a **draft**; saving writes only `UserProfile`.
- [ ] All reads/writes are scoped to the session user.
- [ ] Zod rejects invalid salary ranges and unknown enum values.

### Metrics

| Metric | Target | Evidence |
|---|---|---|
| Profile save latency (p95) | < 400 ms | Server Action timing |
| Profile completeness after onboarding | ≥ 80% | Fixture/E2E run |
| Cross-tenant read attempts succeeding | 0 | IDOR test |
| Duplicate skills after save | 0 | DB query |

---

## 3. M2 — Job Discovery (Greenhouse + Lever)

### Functional

- [ ] User can add a Greenhouse or Lever board by token; the app probes it before saving.
- [ ] A 404 token is rejected with `INVALID_TOKEN`; a 200 with zero jobs is accepted.
- [ ] Manual “Test connection” and “Sync now” work.
- [ ] Sync normalizes `externalId`, `companyKey`, `titleKey`, `workArrangement`, dates, salary, `descriptionText`, and `descriptionHash`.
- [ ] Same `(userId, sourceId, externalId)` never creates a second row.
- [ ] Cross-source fingerprint duplicates within 30 days are linked via `duplicateOfId`.
- [ ] A full snapshot marks absent jobs inactive and sets `closedAt`; a failed/partial fetch does **not** delist anything.
- [ ] Content changes update the description but preserve `triageStatus`.
- [ ] New jobs appear in the triage inbox with `NEW`.
- [ ] User can convert a discovered job to an `Opportunity`, creating or linking the parent `Company`; the link is preserved.
- [ ] User can dismiss a job; it leaves the default inbox.
- [ ] Source health tracks `lastSuccessAt`, `consecutiveFailures`, `lastErrorCode`, and status badges.
- [ ] After 5 consecutive transient failures the source becomes `ERROR` and backs off.
- [ ] One failing board does not block the others; the run reports partial success.

### Metrics

| Metric | Target | Evidence |
|---|---|---|
| Probe latency (p95) | < 2 s | Timing log |
| Sync duration (3 boards, ~100 jobs) | < 30 s | Job run log |
| Duplicate rows for natural key | 0 | DB constraint + test |
| Cross-source duplicates in fixture | 0 | Dedup test |
| Sync success rate over 20 runs | ≥ 95% | Run history |
| Delisting detection | 100% within one successful sync | Fixture test |
| Invalid token rejection | 100% with clear error | Probe test |
| Circuit breaker opens after 5 failures | 100% | Failure-injection test |

### Fixture and failure matrix

- [ ] Normal Greenhouse and Lever payloads.
- [ ] Empty board (`mistral` shape).
- [ ] Malformed JSON.
- [ ] Missing optional fields (salary, department, workplace type).
- [ ] 404, 401/403, 429 with `Retry-After`, 500, timeout, oversized body.
- [ ] HTML-escaped Greenhouse `content` decoded exactly once.
- [ ] Lever epoch-ms dates parsed correctly.

---

## 4. M3 — Explainable Matching

### Functional

- [ ] Every newly discovered job is evaluated or explicitly marked as skipped with a reason.
- [ ] The **server** computes `matchScore`; the LLM response cannot set it.
- [ ] Component scores (`techScore`, `seniorityScore`, `locationScore`, `semanticScore`) are stored.
- [ ] `recommendation` is derived from the server score using the documented thresholds.
- [ ] `matchedSkills` and `missingSkills` are normalized and deduplicated.
- [ ] The rationale is stored and shown; it is clearly labeled as AI-generated.
- [ ] LLM output is validated with Zod; invalid output falls back deterministically with `confidence = LOW`.
- [ ] If the LLM is unavailable, the deterministic score is returned and the UI says “AI explanation unavailable”.
- [ ] Identical `inputHash` does not trigger a second model call.
- [ ] `scoringVersion`, `model`, and `inputHash` are persisted.
- [ ] `ExperienceLevel.LEAD` exists; Staff/Principal map to `LEAD` for MVP.
- [ ] A job with no extracted skills yields `techScore = 50`, `confidence = LOW`, and does not crash.

### Metrics

| Metric | Target | Evidence |
|---|---|---|
| Precision@5 | ≥ 0.80 | Gold-set evaluation |
| Strong Precision@5 | ≥ 0.60 | Gold-set evaluation |
| Recall@10 | ≥ 0.70 | Gold-set evaluation |
| NDCG@10 | ≥ 0.75 | Gold-set evaluation |
| Spearman correlation | ≥ 0.65 | Gold-set evaluation |
| Calibration gap (mean STRONG − mean LOW) | ≥ 25 points | Gold-set evaluation |
| Stability (3 runs, same input) | std ≤ 5 points | Evaluation log |
| Latency p95 (with LLM) | ≤ 2.5 s | Timing log |
| Deterministic path latency | ≤ 50 ms | Timing log |
| Cost per job | ≤ $0.01 | Usage log |
| LLM-owned final scores | 0 | Code review + test |

### Gold set

- [ ] 40 job descriptions: 15 STRONG, 15 POTENTIAL, 10 LOW.
- [ ] Two annotators; Cohen’s kappa ≥ 0.60.
- [ ] English and Arabic; remote/hybrid/on-site; missing salary; noisy HTML.
- [ ] Frozen as `tests/fixtures/matching-gold-v1.json`.
- [ ] 20 dev / 20 test split; no tuning on the test split.
- [ ] Hybrid model beats keyword baseline by ≥ 10 points on Precision@5; otherwise ship deterministic only.

---

## 5. M4 — Contacts, Outreach, and Follow-up

### Contact discovery

- [ ] User can add a contact manually with name, role, company, profile URL, and source.
- [ ] `sourceType` is required and stored (`MANUAL`, `REFERRAL`, `COMPANY_PAGE`, `GITHUB`, `COMMUNITY`, `OTHER`).
- [ ] `lastVerifiedAt` is recorded when the user confirms the role/company.
- [ ] Duplicate normalized profile URLs for the same user are rejected or merged.
- [ ] The app suggests target titles and can generate a LinkedIn search deep link.
- [ ] Opening the link is user-initiated; the app makes **zero** LinkedIn network calls.
- [ ] The app never asks for LinkedIn credentials, cookies, or a session token.
- [ ] No headless browser, extension, or Voyager API code exists.

### Outreach

- [ ] User selects contact + opportunity + goal + language + tone.
- [ ] AI drafts from the profile, company, opportunity, and user-provided facts only.
- [ ] The draft is Zod-validated and editable.
- [ ] Approval sets `MessageDraft.status = APPROVED`; nothing is auto-sent.
- [ ] “Copy & Open” copies the approved text and opens the profile URL.
- [ ] Clipboard denial shows selectable text and a copy fallback.
- [ ] “Mark as Sent” logs one `OutreachActivity`, sets `MessageDraft.status = SENT`, and creates **exactly one** `FollowUpTask` due in 3 days.
- [ ] Re-clicking “Mark as Sent” does not create a duplicate follow-up.

### Follow-up

- [ ] Dashboard shows due and overdue follow-ups.
- [ ] Completing a task sets `state = DONE` and `completedAt`.
- [ ] Snooze updates the due date without duplicating the task.
- [ ] Stale contacts (>14 days without activity) are flagged.
- [ ] Overdue counts match the database.

### Metrics

| Metric | Target | Evidence |
|---|---|---|
| LinkedIn network calls from the app | 0 | Code search + network log |
| Contacts with a source recorded | 100% | DB query |
| Time to add a contact from an opportunity | < 60 s | E2E timing |
| Duplicate contacts by normalized URL | 0 | DB constraint + test |
| Auto-sent messages | 0 | Code review + test |
| User confirmation before send | 100% | E2E test |
| Draft latency (p95) | < 4 s | Timing log |
| Follow-ups created per send | Exactly 1 | Idempotency test |

---

## 6. M5 — Hardening & Release

- [ ] End-to-end journey test passes: profile → board → sync → match → review → contact → draft → approve → mark sent → follow-up.
- [ ] Backup/restore drill includes the `pgboss` schema.
- [ ] Queue depth, oldest ready job, failure count, dead-letter count, and worker heartbeat are observable.
- [ ] A worker crash mid-job is redelivered and completes idempotently.
- [ ] Graceful shutdown drains in-flight jobs.
- [ ] Rollback runbook is tested on a staging copy.
- [ ] No secrets in git; `.env.example` is current.
- [ ] `prisma migrate status` is clean after deploy.
- [ ] Release checklist is signed off.

---

## 7. Global Gates (every milestone)

### Build and schema

- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes; default suite makes no live network calls.
- [ ] `npm run lint` has no new errors.
- [ ] `npx prisma validate` passes.
- [ ] Migration drift gate passes.
- [ ] No `prisma db push` in staging/production.
- [ ] `prisma generate` has run; the client matches the schema.

### Security

- [ ] 100% of Server Actions call `requireAuth()` and scope by `userId`.
- [ ] IDOR test: a second user cannot read, update, or delete another user's rows.
- [ ] SSRF tests cover private IPv4, IPv6, IPv4-mapped IPv6, NAT64, redirect-to-private, DNS rebinding, chunked oversize, and timeout.
- [ ] Untrusted job text is delimited and never treated as instructions.
- [ ] LLM output is Zod-validated; no `JSON.parse`-and-trust path.
- [ ] No LinkedIn credentials, cookies, profile fetching, search, connections, or messaging APIs.
- [ ] External HTML is sanitized; no unsanitized `dangerouslySetInnerHTML`.
- [ ] Rate limits return 429 with a safe message.
- [ ] No secrets in logs or job payloads.

### Data

- [ ] Every user-owned table has `userId` and an index starting with it.
- [ ] Natural keys have uniqueness constraints.
- [ ] Additive migrations have a documented rollback.
- [ ] No speculative tables were added.

---

## 8. Performance & Reliability SLAs

| Metric | Target | Verification |
|---|---|---|
| Server Component render (p95) | < 250 ms | Next.js timing |
| Server Action mutation (p95, non-LLM) | < 400 ms | Action trace |
| LLM generation (p95) | < 4 s | Timing log |
| Matching evaluation (p95) | ≤ 2.5 s | Timing log |
| Database query (p95, indexed) | < 15 ms | `pg_stat_statements` |
| ATS sync (3 boards, ~100 jobs) | < 30 s | Worker run log |
| Initial client bundle | < 180 KB gzipped | Bundle analyzer |
| Worker graceful shutdown | < 30 s | Shutdown test |

---

## 9. Internationalization & Accessibility

- [ ] Toggling English/Arabic updates `<html dir="rtl" lang="ar">` without a full reload.
- [ ] All labels, buttons, dialog titles, and validation errors exist in `src/locales/en.json` and `src/locales/ar.json`.
- [ ] Arabic layout mirrors correctly using logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`).
- [ ] Interactive elements are keyboard-operable and have ARIA labels.
- [ ] Color contrast meets WCAG AA for score badges and status chips.
- [ ] Dates and numbers are formatted per locale.

---

## 10. Evidence Template (attach to each milestone PR)

```text
Milestone:
Commit:
Commands run:
  - npm run typecheck -> PASS/FAIL
  - npm test -> PASS/FAIL (N tests)
  - npm run lint -> PASS/FAIL (N errors)
  - npx prisma validate -> PASS/FAIL
  - node scripts/check-migrations.mjs -> PASS/FAIL
Metrics:
  - <metric>: <measured value> (target <target>)
Screenshots:
  - <path or attachment>
Known limitations:
  - <list>
Rollback:
  - <steps>
```
