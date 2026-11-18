## RELEASE

- Application: Community Services Management System
- Release: v1.0.0
- Release Type: Final Course Release

## RELEASE SUMMARY

CSMS v1.0.0 is the final release of the Community Services Management System, a browser-based application built with JavaScript and Express.js. The system allows community services staff to manage Residents and Service Requests through a web interface with a dashboard summarizing THE system state.

## RESIDENT MANAGEMENT CAPABILITIES

- Register new Residents with first name, last name, address, contact number, and email
- Validate Resident information using server-side application validation (T02)
- Persist Residents in SQLite with auto-generated IDs (T03)
- Search Residents by partial, case-insensitive first name or last name (T05)
- List all Residents ordered by last name, then first name, then ID (T05)
- Update permitted Resident information while preserving ID and status (T06)
- Deactivate Active Residents to Inactive status (T07)
- Inactive Residents remain persisted, searchable, and visible in all listings
- All operations accessible through the Resident Management browser interface (T12)

## SERVICE REQUEST MANAGEMENT CAPABILITIES

- Submit new Service Requests with resident ID, service type, description, and date requested (T09)
- Validate Service Request information using server-side application validation
- Verify Resident existence and Active status before allowing submission
- Reject submissions for missing or Inactive Residents
- New Service Requests default to Pending status with auto-generated IDs
- Search Service Requests by partial, case-insensitive service type or description (T11)
- Filter Service Requests by status (Pending, In Progress, Completed, Cancelled)
- Combine text search and status filtering
- View Service Request details (T11)
- Controlled status workflow with allowed transitions (T10):
  - Pending to In Progress
  - Pending to Cancelled
  - In Progress to Completed
  - In Progress to Cancelled
- Completed and Cancelled are terminal states
- All operations accessible through the Service Request Management browser interface (T13)

## DASHBOARD CAPABILITIES

- Total, Active, and Inactive Resident counts
- Total, Pending, In Progress, Completed, and Cancelled Service Request counts
- Open Service Requests count
- Five most recent Service Requests
- Read-only with empty-state handling

## QUALITY AND HARDENING

T15 reviewed all nine hardening areas. One error was found and fixed (error page missing navigation links). All invalid input, persistence integrity, mutation safety, workflow protection, query safety, test reliability, and repository hygiene checks had passed.

T16 finalized release identity verification and confirmed the full suite passes twice.

## FINAL VERIFICATION

| Verification | Result |
|---|---|
| Final Regression Run 1 | PASS (170/170) |
| Final Regression Run 2 | PASS (170/170) |
| Application Startup | PASS |
| /health | PASS — reports CSMS v1.0.0 status ok |
| Dashboard | PASS |
| Resident Management | PASS |
| Service Request Management | PASS |
| Final Release Version | 1.0.0 |

## KNOWN LIMITATIONS

- Two unused placeholder service files (ResidentService.js, RequestService.js) remain from the starter template.
- The application does not implement authentication, authorization, or user accounts. This is outside the defined CSMS scope.

No known release-blocking limitations remain within the defined CSMS v1.0.0 scope.