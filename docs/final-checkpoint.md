## DEVELOPER INFORMATION

- Name: Josh Leonard O. Mendoza
- GitHub Username: @ttetromino
- Technology Stack: JavaScript with Express.js
- T16 Branch: feature/t16-final-release
- Final Release Version: 1.0.0

## MY FINAL RELEASE IMPLEMENTATION

For my final release implementation, I put the release version in `src/config/application.js` since that file already had the app name, version, and sprint info all in one place.

For `/health`, the controller just imports that config and returns the short name and version in the JSON. I didn't hardcode anything in the controller itself since it'll pull from the config insteaad.

When developing the bowser part, I didn't want to go into every single controller and manually pass the version to every `res.render()` call so o I used `app.locals` in `app.js` to set the version once, and then every EJS template can just use it automatically. Since everything reads from the same config, if I ever need to bump the version to like 1.0.1 I just change it in one spot and itll update everything.

## FILES I CHANGED

- File: `src/config/application.js`
    - Purpose: Central application configuration. Updated the version to 1.0.0 and added a short name field for the `/health` endpoint.

- File: `src/controllers/healthController.js`
    - Purpose: Health endpoint controller. Updated to report the short name "CSMS" instead of the full application name, sourced from the config.

- File: `src/app.js`
    - Purpose: Express application factory. Added `app.locals.applicationVersion` so all EJS templates can display the release version from the single config source.

- File: `src/views/dashboard.ejs`
    - Purpose: Dashboard view. Added a version badge in the navigation bar.

- File: `test/application.test.js`
    - Purpose: Starter automated tests. Updated two assertions that checked old version and sprint values to match the 1.0.0 release.

- File: `test/t16-final-exam.test.js`
    - Purpose: New file containing the final examination integration test and release-version verification tests.

- File: `docs/release-v1.0.0.md`
    - Purpose: Official release notes for CSMS v1.0.0.

## MY FINAL EXAMINATION TEST

Test Name: "should reflect resident deactivation in service request eligibility and dashboard counts"

Modules/Responsibilities Covered:
- Resident registration (T04)
- Resident deactivation (T07)
- Service Request submission and eligibility (T09)
- Service Request status workflow (T10)
- Dashboard aggregate counts (T14)

Starting State: Empty database with no residents and no service requests.

Operations Performed:
1. Registered a new Resident through the POST interface.
2. Submitted a Service Request for that Resident through the POST interface.
3. Verified dashboard counts reflected 1 Active resident and 1 Pending request.
4. Deactivated the Resident through the POST interface.
5. Attempted a second Service Request submission for the now-Inactive Resident.
6. Verified the second submission was rejected and no new request was persisted.
7. Transitioned the existing request from Pending to In Progress to Completed.
8. Verified dashboard counts reflected the completed workflow.

Expected Final State: 1 Inactive resident, 1 Completed service request, 0 open requests, 0 active residents, dashboard counts matching persistence at every step.

Why This Test Is Meaningful: A simple unit test checks one service in isolation. This test proves that registration, eligibility checking, workflow transitions, and dashboard aggregation all work together through the presentation layer with real persistence. It also verifies that business rules (Inactive Resident cannot submit) remain enforced even after a valid lifecycle change, and that the dashboard reflects every state change correctly.

## MY FINAL TECHNICAL DECISION

Decision: I used `app.locals` in Express to make the release version available to all EJS templates rather than passing the version from each controller to each view.

Alternative Considered: I could have imported `applicationConfig` into every controller and passed `applicationVersion` as a view parameter in every `res.render()` call.

Reason for My Decision: Using `app.locals` follows the Express.js convention for data that every template needs. It avoids duplicating the version-passing logic across six controllers and ten-plus render calls.

## PROBLEM OR VERIFICATION ISSUE ENCOUNTERED

Problem: After updating the application version to 1.0.0 and the sprint name to "Sprint 6 - Final Release", two starter tests in `test/application.test.js` failed.

Cause: The starter tests had hardcoded assertions checking for the old version "0.1.0", the old sprint name "Sprint 0 - Developer Onboarding", and the full application name in the `/health` response.

Investigation: I read the failing test output, identified which assertions were checking old config values, and confirmed that the config changes were intentional for the v1.0.0 release.

Resolution: I updated the two test assertions to match the new release values. I did not delete or skip the tests. The assertions still verify that the home page displays the correct config values and that `/health` returns the correct payload.  They just now check for the release values instead of the starter values.

## FINAL REGRESSION RESULTS

Test Command: `npm test`

Final Regression Run 1: 170 pass, 0 fail

Final Regression Run 2: 170 pass, 0 fail

Total Passing Tests Reported: 170

## TOOLS AND REFERENCES USED

- Node.js and node:sqlite documentation for runtime and database APIs
- Express.js documentation for `app.locals` and view rendering conventions
- Existing CSMS repository documentation in `docs/`
- Kiro AI coding assistant for implementation support and code review
- VS Code as the primary IDE

## FINAL RELEASE DECLARATION

CSMS v1.0.0 - READY FOR RELEASE
