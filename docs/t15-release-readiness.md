## Developer Information

- Name: Josh Leonard O. Mendoza
- GitHub Username: @ttetromino
- Primary Technology Stack: JavaScript with Express.js
- T15 Branch: feature/t15-system-hardening

## Release Candidate Baseline

Before the T15 acitivty, the following were verified as working:

- Application startup: PASS
- /health endpoint: PASS
- Dashboard: PASS
- Resident Management: PASS
- Service Request Management: PASS
- Starter through T14 automated tests: PASS (160/160)

## Hardening Changes

| Area | Issue or Risk Found | Action Taken | Files Changed | Test/Evidence |
|---|---|---|---|---|
| Interface Navigation | Error page only linked to Resident Management and Home, missing Dashboard and Service Request Management links | Added navigation links to Dashboard, Service Request Management | `src/views/error.ejs` | Manual navigation verification |
| Invalid Input Handling | Reviewed malformed route identifiers (e.g. /residents/abc/edit) | When reviewed, no errors were found. | None | T15 Test Category 1 |
| Persistence Integrity | Reviewed rejected mutation persistence safety | When reviewed, no errors were found. | None | T15 Test Category 2 |
| HTTP Mutation Safety | Reviewed GET read-only safety across all routes | When reviewed, no errors were found. | None | T15 Test Category 3 |
| Query Safety | Reviewed SQL parameter binding | When reviewed, no errors were found. | None | Grep audit of repositories |
| Workflow Protection | Reviewed terminal-state enforcement | When reviewed, no errors were found. | None | T15 Test Category 5 |
| Dashboard Aggregation | Reviewed for findAll() loops | When reviewed, no errors were found. | None | Code review of DashboardService.js |
| Repository Hygiene | Reviewed for debug artifacts, committed DB files, secrets | When reviewed, no errors were found. | None | git ls-files audit |
| Test Reliability | Reviewed for test-order dependencies, hardcoded IDs | When reviewed, no errors were found. | None | Two consecutive full-suite runs pass |

## Five New T15 Hardening Tests

### Test 1: Malformed route identifier does not crash or modify persistence
- **Category 1:** Invalid or Malformed Input
- **What it verifies:** Requesting `/residents/abc/edit` returns a controlled 404 without exposing a stack trace, and persistence remains unchanged.
- **Why it adds value:** Existing tests cover nonexistent numeric IDs but not non-numeric malformed identifiers. This confirms the presentation layer handles garbage input safely.

### Test 2: Invalid Service Request transition leaves persistence unchanged
- **Category 2:** Rejected Mutation Protects Persistence
- **What it verifies:** Attempting an invalid Pending-to-Completed transition is rejected, and the persisted Service Request is re-fetched to confirm every field remains unchanged.
- **Why it adds value:** Existing T10 tests verify the service rejects invalid transitions, but none re-fetch the record from the database.

### Test 3: Repeated GET requests do not modify persistence
- **Category 3:** Read-Only Request Safety
- **What it verifies:** Nine GET requests across Dashboard, Resident list/search/edit, Service Request list/search/filter/details are performed, then persistence is checked by count and status.
- **Why it adds value:** Existing T12/T13 tests check that GET does not change status, but this test checks across all read-only routes in a single sequence and verifies at the database level using aggregate counts.

### Test 4: Resident deactivation is reflected in Dashboard counts
- **Category 4:** Cross-Feature Regression
- **What it verifies:** Deactivating a Resident through the T12 POST interface updates the T14 Dashboard aggregate counts.
- **Why it adds value:** No existing test crosses the boundary between T12 (the deactivation interface) and T14 (the dashboard aggregation). This proves the two features integrate correctly.

### Test 5: Terminal-state protection: Completed request cannot transition again
- **Category 5:** Repeatability or Boundary Behavior
- **What it verifies:** A Completed Service Request is subjected to three invalid transition attempts (to In Progress, to Cancelled, to Completed again). After each attempt, the persisted record is re-fetched to confirm it remains Completed.
- **Why it adds value:** Existing T10 tests check individual invalid transitions, but none test multiple consecutive invalid attempts against a terminal state through the presentation layer.

## Full Regression Test Results

- **Test command used:** `npm test`
- **Run 1 result:** 165 pass, 0 fail
- **Run 2 result:** 165 pass, 0 fail
- **Total passing tests reported by test framework:** 165

Both complete runs passed with no failures.

## Manual Release Verification

| Verification | Result | Notes |
|---|---|---|
| Application starts | PASS | Express.js starts on configured port |
| /health works | PASS | Returns JSON with status ok |
| Dashboard loads | PASS | Renders all summary cards and recent requests |
| Resident listing/search works | PASS | Lists residents, search filters by name |
| Valid Resident registration works | PASS | New resident persists with Active status |
| Invalid Resident registration is rejected | PASS | Validation feedback shown, no persistence |
| Resident update works | PASS | Editable fields change, ID and status preserved |
| Resident deactivation works and record remains visible | PASS | Status becomes Inactive, record still listed and searchable |
| Valid Service Request submission for Active Resident works | PASS | Request persists with Pending status and generated ID |
| Missing/Inactive Resident submission is rejected | PASS | Appropriate feedback shown, no persistence |
| Service Request search/filter/details work | PASS | Text search, status filter, combined filter, and details view all functional |
| Valid Service Request workflow works | PASS | Pending to In Progress to Completed path functional |
| Invalid/terminal transition is rejected | PASS | Invalid transitions rejected, persistence unchanged |
| Dashboard reflects Resident/Service Request changes | PASS | Counts update after deactivation and status transitions |
| Read-only GET operations do not modify persistence | PASS | Verified by T15 Test Category 3 |

## Repository Hygiene Review

| Item | Status |
|---|---|
| Debug output (console.log in production code) | Reviewed — only server.js startup message, which is expected |
| Temporary files | Reviewed — none found in tracked files |
| Generated build/runtime artifacts | Reviewed — none committed |
| Accidental local database files | Reviewed — .gitignore covers *.db, *.sqlite, data/ |
| Commented-out abandoned code | Reviewed — none found |
| Secrets/credentials | Reviewed — none committed |
| Broken navigation/links | Found and fixed — error.ejs missing Dashboard and Service Request links |
| Direct SQL parameter binding | Reviewed — all SQL uses parameterized ? placeholders |

## Known Limitations

- Two unused placeholder service files (`ResidentService.js`, `RequestService.js`) remain in the repository from the starter template. They are empty classes never imported by any module. They do not affect functionality or security.
- The `currentSprint` field in `src/config/application.js` still reads "Sprint 0 - Developer Onboarding" and the home page displays this value. This is cosmetic and does not affect any CSMS functionality.

No known release-blocking limitations identified within the defined CSMS scope.

## Release Candidate Statement

READY FOR T16 FINAL EXAM
