# CSMS JavaScript Developer Handbook

## Purpose

This handbook defines the standard development practices for the JavaScript implementation of CSMS.

Students should follow these practices throughout the semester unless an activity provides more specific instructions.

## Required Tools

- Node.js 24
- npm 11 or later
- Git
- GitHub
- Visual Studio Code or another JavaScript-compatible editor
- Web browser

## Verify the Environment

Run:

```bash
node --version
npm --version
git --version
```

The project requires Node.js 24.

If you use Node Version Manager:

```bash
nvm use
```

## Install Dependencies

For a repository containing `package-lock.json`, use:

```bash
npm ci
```

Do not commit:

```text
node_modules/
```

## Run the Application

```bash
npm start
```

The application normally runs at:

```text
http://127.0.0.1:3000
```

## Development Watch Mode

```bash
npm run dev
```

This uses Node.js watch mode.

## Run Tests

```bash
npm test
```

All required tests must pass before submitting work.

## Before Starting an Activity

Begin from the project directory.

Check:

```bash
git status
git branch --show-current
```

Your previous work should be committed before starting another activity.

## Update Main

Switch to `main`:

```bash
git switch main
```

Update it:

```bash
git pull origin main
```

Do not begin a new activity from an unfinished feature branch.

## Create the Required Feature Branch

Use the branch name specified by the activity.

Example:

```bash
git switch -c feature/t01-resident-domain-model
```

Verify:

```bash
git branch --show-current
```

## Understand Before Editing

Before modifying code:

1. Read the complete Moodle activity.
2. Identify the required files.
3. Identify the expected behavior.
4. Identify the required automated tests.
5. Review the existing project structure.
6. Implement only the assigned scope.

Do not begin by randomly modifying files until tests pass.

## Development Cycle

A recommended development cycle is:

1. Make a small change.
2. Save the file.
3. Run the relevant test suite.
4. Read any error carefully.
5. Correct the implementation.
6. Run the tests again.
7. Continue until the requirement is complete.

## JavaScript Conventions

Follow the conventions established by the existing codebase.

The starter project uses:

- ES modules
- `import`
- `export`
- `camelCase`
- double quotes
- semicolons
- 2-space indentation

Do not introduce a formatter, linter, transpiler, or different module system unless the project or current ticket requires it.

## Testing

The project uses the Node.js built-in test runner.

Run:

```bash
npm test
```

The project also uses Supertest for HTTP behavior.

Before completing an activity, always run the complete suite.

Existing tests should continue to pass.

A new feature should not unnecessarily break previously completed functionality.

## Verify the Application

When the activity affects application behavior, run:

```bash
npm start
```

Verify the required endpoint or interface.

For the starter application, useful checks include:

```text
http://127.0.0.1:3000
http://127.0.0.1:3000/health
```

Stop the server with:

```text
Ctrl + C
```

## Review Your Work

Before staging files:

```bash
git status
git diff
```

Confirm that:

- only expected files changed
- `node_modules/` was not added
- temporary files were not added
- generated files were not added
- unrelated starter files were not modified

## Stage Changes

Prefer explicitly staging the files that belong to the activity.

Example:

```bash
git add src/models/Resident.js
git add test/application.test.js
```

Then review:

```bash
git status
git diff --staged
```

Avoid using:

```bash
git add .
```

when unrelated files are present.

## Commit

Use the commit message required by the activity.

Example:

```bash
git commit -m "feat: define resident domain model"
```

Do not use vague messages such as:

```text
update
changes
done
activity
final
fix
```

The commit message should describe the change.

## Commit Types

Common commit types include:

```text
feat
fix
test
docs
refactor
chore
```

Examples:

```text
feat: define resident domain model
fix: correct health response
test: add resident behavior coverage
docs: update JavaScript setup instructions
refactor: simplify resident service
chore: update development configuration
```

## Push

Push a new feature branch:

```bash
git push -u origin <branch-name>
```

For later pushes on the same tracked branch:

```bash
git push
```

## Pull Requests

When required, create a Pull Request using the branches specified by the activity.

Before creating the Pull Request, verify:

```bash
git status
npm test
```

The working tree should be clean and all required tests should pass.

Review the Pull Request's **Files changed** section before submission.

## Debugging

When an error occurs, read the error message before changing code.

Determine:

1. Which command failed?
2. Which file is mentioned?
3. Which line is mentioned?
4. What error type occurred?
5. Is the problem related to code, Node.js, dependencies, Git, tests, or application behavior?

Avoid making unrelated changes while troubleshooting one problem.

## Common Setup Problems

### Wrong Node.js Version

Check:

```bash
node --version
cat .nvmrc
```

If you use `nvm`:

```bash
nvm use
```

### Dependencies Are Missing

Run:

```bash
npm ci
```

### `node_modules` Was Deleted

Run:

```bash
npm ci
```

Do not restore or copy `node_modules` manually.

### Tests Fail After Your Changes

Inspect:

```bash
git diff
```

Determine which requirement or previous behavior was affected.

Do not modify unrelated files merely to force tests to pass.

### Application Does Not Start

Check:

```bash
node --version
npm --version
npm ci
npm start
```

Read the reported error carefully.

## Files That Should Not Be Committed

Do not intentionally commit local or generated files such as:

```text
node_modules/
.env
.DS_Store
npm-debug.log
coverage/
```

Follow the repository's `.gitignore`.

## Student Responsibility

Students must understand their implementation.

You may be asked to explain:

- a class
- a function
- a test
- a Git command
- a commit
- a branch
- a Pull Request
- a design decision
- an error you encountered
- how you verified your solution

Successful execution alone is not sufficient if the submitted work cannot be explained.