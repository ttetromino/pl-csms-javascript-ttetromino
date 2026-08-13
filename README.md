[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=24305473&assignment_repo_type=AssignmentRepo)
# Community Services Management System

The **Community Services Management System (CSMS)** is the semester-long software development project for the Programming Languages Laboratory.

This repository contains the **JavaScript implementation of CSMS using Node.js and Express.js**.

Students will incrementally develop this application throughout the semester using professional software development practices including Git, GitHub, feature branches, automated testing, code review, Pull Requests, documentation, and incremental software delivery.

## Technology Stack

- JavaScript
- Node.js 24
- npm 11 or later
- Express.js 5
- EJS
- Node.js built-in test runner
- Supertest
- Git
- GitHub

## Important

This repository is a **starter project**.

Some models, repositories, services, utilities, controllers, and other components may intentionally contain minimal implementations or placeholders.

Do not attempt to complete future functionality unless it is required by the current Moodle activity or development ticket.

Students are expected to implement the system incrementally throughout the semester.

## Current Starter Scope

The starter repository currently provides:

- Express.js application structure
- EJS starter interface
- `/health` JSON endpoint
- HTTP 404 handling
- automated application tests
- layered application architecture
- Git workflow documentation
- Pull Request template

The starter does not yet provide completed:

- Resident management
- Service Request processing
- persistence
- authentication
- Resident user interface
- Resident API
- advanced validation
- other future CSMS functionality

These features will be introduced through later tickets.

## Prerequisites

Before starting, verify that the following tools are installed:

```bash
node --version
npm --version
git --version
```

The project requires:

```text
Node.js 24
npm 11 or later
```

The required Node major version is also declared in:

```text
.nvmrc
```

and `package.json`.

Students may use an appropriate editor or IDE such as:

- Visual Studio Code
- WebStorm
- another JavaScript-compatible development environment

## Initial Setup

After cloning your GitHub Classroom repository, open a terminal inside the project directory.

### 1. Verify Node.js

```bash
node --version
npm --version
```

If you use Node Version Manager:

```bash
nvm use
```

### 2. Install Dependencies

```bash
npm ci
```

Use `npm ci` because this project includes `package-lock.json`.

The `node_modules/` directory is intentionally not stored in Git and must be generated locally.

### 3. Run the Automated Tests

```bash
npm test
```

All baseline tests should pass before beginning a development activity.

### 4. Start the Application

```bash
npm start
```

The application normally starts at:

```text
http://127.0.0.1:3000
```

### 5. Verify the Health Endpoint

While the application is running, open:

```text
http://127.0.0.1:3000/health
```

The endpoint should return JSON similar to:

```json
{
  "status": "ok",
  "application": "Community Services Management System",
  "version": "0.1.0"
}
```

### 6. Development Watch Mode

During development, you may use:

```bash
npm run dev
```

This starts the application using Node.js watch mode.

## Automated Testing

This project uses the Node.js built-in test runner.

Run the complete test suite using:

```bash
npm test
```

The project also uses Supertest for HTTP-level application testing.

Students are expected to run the relevant tests during development and the complete test suite before submitting their work.

## JavaScript Conventions

The project uses:

- ES modules
- `import` and `export`
- `camelCase` for JavaScript properties and variables
- semicolons
- double quotes
- 2-space indentation

Follow the style already established in the repository.

Do not introduce a new formatter or linter unless required by the project or current activity.

## Development Workflow

For each development activity:

1. Update your local `main` branch.
2. Create the required feature branch.
3. Read the complete ticket before editing.
4. Implement only the assigned requirement.
5. Add or update automated tests.
6. Run the complete test suite.
7. Verify the application when required.
8. Review your changes using Git.
9. Stage only the files that belong to the ticket.
10. Commit using the required commit message.
11. Push the feature branch.
12. Create a Pull Request when required.

Do not perform normal ticket development directly on `main`.

## Documentation

Read the project documentation before beginning development:

```text
docs/project-overview.md
docs/architecture.md
docs/developer-handbook.md
docs/git-cheatsheet.md
docs/release-workflow.md
```

Students should also read the instructions associated with the current Moodle activity or development ticket.

## Developer Identification

Complete:

```text
ABOUT_THE_DEVELOPER.md
```

during Sprint 0 Developer Onboarding.

Do not remove this file during the semester.

## Academic Integrity

All submitted code must represent the student's own work.

Students may use documentation, development tools, and approved learning resources, but they must understand the code they submit and must be able to explain their implementation, tests, Git history, and design decisions.

Do not copy another student's implementation or allow another student to submit your work.

## Project Principle

Develop the system incrementally.

Do not try to build the entire application at once.

Each activity introduces a small part of the system and builds upon work completed in previous activities.