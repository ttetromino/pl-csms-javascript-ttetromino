# CSMS JavaScript Development and Release Workflow

## Purpose

This document describes how completed CSMS JavaScript development work moves from an assigned ticket to a reviewed repository state.

For this course, a release represents a verified project state produced through incremental development.

## Development Flow

The standard workflow is:

1. Begin from an updated `main` branch.
2. Create the required feature branch.
3. Read the complete ticket.
4. Implement the assigned requirement.
5. Add or update automated tests.
6. Run the complete test suite.
7. Verify application behavior when required.
8. Review the changed files.
9. Stage only the intended files.
10. Commit the completed change.
11. Push the feature branch.
12. Create a Pull Request when required.
13. Complete the required Moodle submission.

## Main Branch

The `main` branch represents the stable integrated state of the project.

Activity development should normally occur on feature branches.

Students should avoid making experimental or incomplete changes directly on `main`.

## Feature Branches

Each assigned development ticket should use the branch name specified by the instructor.

Example:

```text
feature/t01-resident-domain-model
```

Feature branches should contain work related to that activity.

Avoid combining unrelated tickets in one branch.

## Before Development

Run:

```bash
git switch main
git pull origin main
git status
```

Then create the required branch.

Example:

```bash
git switch -c feature/t01-resident-domain-model
```

## Implementation Scope

Implement only the requirements of the assigned ticket.

Do not implement future:

- models
- persistence
- controllers
- services
- routes
- validation
- middleware
- user interface behavior
- APIs

unless they are required by the current activity.

## Automated Verification

Before considering a feature complete, run:

```bash
npm test
```

All required tests must pass.

Existing application tests should continue to pass.

## Manual Verification

When the activity affects running application behavior, start the application:

```bash
npm start
```

Verify the required behavior.

The starter application normally runs at:

```text
http://127.0.0.1:3000
```

The health endpoint is:

```text
http://127.0.0.1:3000/health
```

Stop the application with:

```text
Ctrl + C
```

## Review Changes

Before staging:

```bash
git status
git diff
```

Confirm that only expected files changed.

## Stage Changes

Prefer explicitly staging the files that belong to the ticket.

Example:

```bash
git add src/models/Resident.js
git add test/application.test.js
```

Review:

```bash
git diff --staged
```

## Commit

Use the commit message specified by the activity.

Example:

```bash
git commit -m "feat: define resident domain model"
```

A commit should represent a meaningful development change.

## Push

Push the feature branch:

```bash
git push -u origin <branch-name>
```

Verify that the branch and commit are visible in the correct GitHub repository.

## Pull Request

When the activity requires a Pull Request:

1. Open the appropriate repository on GitHub.
2. Select the completed feature branch.
3. Confirm the correct base repository and branch.
4. Create the Pull Request.
5. Use the required Pull Request title.
6. Provide a concise implementation summary.
7. Describe the tests performed.
8. Review the Files changed section.
9. Verify that no unrelated files are included.
10. Submit the Pull Request.

Do not merge the Pull Request if the activity or instructor requires it to remain open for review.

## Pull Request Content

A Pull Request should normally communicate:

- ticket identifier
- implementation summary
- affected domain or feature
- tests added or updated
- verification performed
- known issues

Students should not claim that tests passed if they were not actually executed.

## Definition of Ready for Submission

A development activity is ready for submission when:

- the required functionality has been implemented
- required automated tests exist or were updated
- the complete test suite passes
- existing functionality still works
- only intended files were changed
- the required commit exists
- the feature branch has been pushed
- the repository is accessible on GitHub
- the required Pull Request has been created
- Moodle submission requirements have been completed

## Versioning

Project versions may be introduced or updated by the instructor as the semester progresses.

Students should not independently change the application version merely because an activity has been completed unless instructed to do so.

## Release Principle

A feature is not complete simply because the code was written.

Completion includes:

1. Implementation
2. Testing
3. Verification
4. Git review
5. Commit
6. Push
7. Pull Request when required
8. Required course submission

A successful development workflow should leave a clear and understandable history of how the application evolved.