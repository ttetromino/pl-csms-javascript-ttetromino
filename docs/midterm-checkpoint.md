# Midterm Checkpoint - T10: Manage Service Request Status

## Developer Information

Name: Josh Leonard O. Mendoza
GitHub Username: @ttetromino
Primary Technology Stack: JavaScript with Express.js
T10 Branch: feature/t10-service-request-status

## My T10 Implementation

I implemented `ServiceRequestStatusService` to manage the status workflow. When `manageStatus()` is called, it first calls `findById()` on the repository to retrieve the existing Service Request.  If the record exists, it checks the requested status against `SUPPORTED_STATUSES` which is the four recognized values but if nothing comes back, it returns a not-found result right away. Then it checks the current status against `ALLOWED_TRANSITIONS`, a map where each status points to a Set of statuses it can move to. If the requested status isn't in that set, it returns an invalid transition result without touching the database. Only when both checks pass does it call `updateStatus()` on the repository, which runs a parameterized `UPDATE ... WHERE id = ?` and returns the freshly retrieved Service Request from `findById()`.


## My Transition Rules

| From | To | Allowed |
|---|---|---|
| Pending | In Progress | Yes |
| Pending | Cancelled | Yes |
| In Progress | Completed | Yes |
| In Progress | Cancelled | Yes |
| Pending | Completed | No |
| In Progress | Pending | No |
| Completed | anything | No |
| Cancelled | anything | No |

I rejected Pending to Completed because a request needs to pass through In Progress first. Skipping that step means the request went from submitted straight to done which doesn't really reflect how the workflow actually works.

Completed is terminal because a finished request is finished. I mapped it to an empty `Set` in `ALLOWED_TRANSITIONS`, so any attempted transition out of it fails the same check as any other invalid transition.

Cancelled works the same waywhere once it was set to cancelled, it stays cancelled. Same-status requests like Pending to Pending are rejected the same way as other invalid transitions.

## Files I Changed

**1.**` ServiceRequestRepository.js`

**Purpose:** I added `updateStatus(id, status)`, which runs a parameterized `UPDATE service_requests SET status = ? WHERE id = ?` and returns the fresh record via `findById()`.

**2.**` ServiceRequestStatusService.js`

**Purpose:** New service I created to enforce the transition rules. It holds the modules `SUPPORTED_STATUSES` and `ALLOWED_TRANSITIONS` while the `manageStatus()` coordinates the lookup and validation.

**3.** ` serviceRequestStatus.test.js`

**Purpose:** Contains the fourteen T10 automated tests.

**4.** `midterm-checkpoint.md`

**Purpose:** Midterm examination documentation.


## Problems That I Encountered

When I first ran the T10 tests, Test 3 (In Progress to Completed) was failing and returning `invalidTransition: true`. The transition should've worked so I checked `ALLOWED_TRANSITIONS` and traced what `existing.status` was returning after the first call to `manageStatus()`. I found a bug where I mistyped `"InProgress"` without a space in one place during early testing so the lookup was returning `undefined` which caused the check to fail. After fixing that though, the tests finally passed.

## My Student-Designed Test

**Test Name:** `managing one service request does not affect another`

**What the Test Verifies:** Two Service Requests are persisted in the same database. I apply a valid status transition to only one of them then it gets both in order to confirm if the first moved to In Progress while the second stayed at Pending.

**Why I Added This Test:** I wanted to verify that the `WHERE id = ?` clause in `updateStatus()` actually works for the right record. If it was missing or wrong, every row in the table would get updated and none of the other tests would catch that because they only ever have one request in the database.

## Tools and References Used

I used the Node.js documentation and the `node:sqlite` documentation to check prepared statement syntax and `DatabaseSync` behavior. I used VS Code as my editor. I used Kiro, an AI coding assistant, to help debug and make sense of some of the T10 components. I'm responsible for understanding all the code in my repository and I can explain any part of it.
