## Developer Information

Name: Josh Leonard O. Mendoza
GitHub Username: @ttetromino
Primary Technology Stack: JavaScript with Express.js
T03 Branch: t03-resident-persistence

## My T03 Implementation

My implementation of T03 was making the SQLite database 'db.js separated from the `ResidentRepository` which would handle persistence and retrieval of `Resident` domain models. When save() is called, it would run an INSERT statement to store the resident's fields in the database. Then, SQLite would automatically generates a unique identifier, which is read from lastInsertRowid and assigned directly to resident.id. When findById() is called, it executes a SELECT statement to fetch the record matching the provided identifier. The repository then converts the database columns back into a Resident class instance. If there is no matching record found, findById() will safely returns null.

## My Persistence Design Decision

I decided to create the database inside `db.js` instead of putting all sql logic inside `ResidentRepository.js` or `app.js`. This allows the repository to receive any SQLite database connection instance. As an alternative, I considered opening the database directly inside the repository constructor, but separating initialization enables tests to inject an isolated temporary database file without touching development data.

## My Database Initialization Design

- Database initialization file or module: `src/database/db.js`  
- Where the database path comes from: Passed as an optional argument to `createDatabase(dbPath)`, defaulting to `./data/csms.db`.  
- How the Resident table is initialized: Using a `CREATE TABLE IF NOT EXISTS residents` command.  
- How repeated initialization is handled: `IF NOT EXISTS` ensures that running the setup multiple times does not drop or duplicate existing records.

## Files I Changed

File: `src/database/db.js`  
Purpose: Handles SQLite database connection creation, directory creation, and schema initialization.

File: `src/repositories/ResidentRepository.js`  
Purpose: Provides `save()`, `findById()`, and row-to-model mapping for `Resident` entities using prepared SQL statements.

File: `test/residentRepository.test.js`  
Purpose: Contains automated unit tests verifying SQLite persistence, ID generation, data integrity, and cross-instance retrieval.

File: `.gitignore`  
Purpose: Prevents SQLite `.db` runtime files from being tracked in Git.

File: `docs/prelim-checkpoint.md`  
Purpose: Preliminary examination documentation.

## SQL I Can Explain

```sql
INSERT INTO residents (first_name, last_name, address, contact_number, email, status)
VALUES (?, ?, ?, ?, ?, ?)
```
Inside the ResidentRepository.save(resident) operation, the query command would make a new row into the residents table with the provided domain fields. Each ? represents a parameterized value (firstName, lastName, address, contactNumber, email, status) to prevent SQL injection. 

## My Resident Mapping

The method mapRowToResident(row) converts snake_case database columns into the camelCase properties caught by the Resident class constructor. For example, the SQLite column first_name maps to firstName, and contact_number maps to contactNumber as a string to preserve the leading zero.

## Problem I Encountered

- Problem or error: The contact_number field risked losing its leading zero if interpreted as a number. 
- Cause: SQLite dynamically types columns if schema definitions are omitted or if values are parsed as number
- How I resolved it: Defined contact_number TEXT NOT NULL in the table schema and ensured parameters are passed as JavaScript strings.

## My Student-Designed Test

- Test name: "assigns unique incrementing IDs to multiple residents"
- What it verifies: Multiple sequential saves generate distinct incrementing IDs without overwriting data.
- Why I chose this scenario: Verifies that the table's AUTOINCREMENT primary key functions correctly.

## Tools and References Used

I used the Node.js Documentation and the node:sqlite documentation to find and understand syntax that I wasn't that familliar with. I used VS Code Editor with the help of Gemini for any bug or error that I encountered while developing the database and tests.