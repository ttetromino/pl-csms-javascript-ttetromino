# CSMS JavaScript Application Architecture

## Purpose

This document describes the intended architectural organization of the JavaScript implementation of the Community Services Management System.

The architecture provides structure for development throughout the semester.

Some components may initially contain placeholders and will be implemented as activities introduce their responsibilities.

## Technology

The application uses:

- JavaScript
- Node.js
- Express.js
- ES modules
- EJS
- Node.js built-in testing
- Supertest

## Project Structure

```text
src/
├── app.js
├── server.js
├── config/
├── controllers/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
└── views/

public/
└── css/

test/
└── application.test.js
```

## Architectural Principle

CSMS separates responsibilities instead of placing all application logic in routes or controllers.

A typical request may involve:

1. A route receives an HTTP request.
2. A controller handles the HTTP interaction.
3. A service coordinates application or business behavior.
4. A repository performs persistence-related operations when required.
5. A model represents domain information.
6. The controller returns an HTTP response or renders an EJS view.

Not every activity will use every layer.

Students should implement only the layers required by the assigned ticket.

## Application Entry Points

### `src/app.js`

Responsible for creating and configuring the Express application.

Typical responsibilities include:

- creating the Express application
- registering middleware
- registering routes
- configuring views
- registering not-found handling

Application configuration that must be testable should generally remain separate from starting the network server.

### `src/server.js`

Responsible for starting the HTTP server.

Keeping server startup separate from application creation allows automated tests to use the Express application without opening a real network port.

## Configuration

Location:

```text
src/config/
```

Contains shared application configuration.

Examples may include:

- application name
- version
- environment-related application values

Do not place unrelated business logic in configuration files.

## Routes

Location:

```text
src/routes/
```

Routes map incoming HTTP paths and methods to application behavior.

Routes should remain concise.

Complex business logic should not be implemented directly inside route definitions.

## Controllers

Location:

```text
src/controllers/
```

Controllers handle HTTP requests and responses.

Typical responsibilities include:

- reading request information
- invoking application services
- selecting HTTP status codes
- returning JSON
- rendering views

Controllers should not become containers for all business logic.

## Services

Location:

```text
src/services/
```

Services coordinate application operations and business behavior.

As the application grows, services help keep controllers focused on HTTP responsibilities.

Examples may include:

```text
ResidentService.js
RequestService.js
```

Some service files may initially contain placeholders.

Do not implement them until required by a ticket.

## Repositories

Location:

```text
src/repositories/
```

Repositories provide an abstraction for data access when persistence is introduced.

Example:

```text
ResidentRepository.js
```

Repository responsibilities may include:

- storing data
- retrieving data
- updating data
- removing data

Persistence behavior should not be duplicated throughout the application.

Do not implement persistence before the corresponding ticket is released.

## Models

Location:

```text
src/models/
```

Models represent important domain concepts.

Examples include:

```text
Resident.js
ServiceRequest.js
```

A model should represent meaningful information and behavior from the CSMS problem domain.

Students should not add speculative properties or functionality simply because they may be useful later.

Implement only the requirements defined by the current ticket.

## Middleware

Location:

```text
src/middleware/
```

Middleware contains reusable HTTP request-processing behavior.

Examples may eventually include:

- request logging
- authentication checks
- request normalization
- common error handling

Middleware should address HTTP request-processing concerns rather than general business logic.

## Utilities

Location:

```text
src/utils/
```

Utilities contain small reusable supporting functions.

Example:

```text
validators.js
```

Do not move major business processes into utility files merely to avoid creating an appropriate service or model.

## Views

Location:

```text
src/views/
```

Contains EJS templates used to render HTML responses.

The user interface will evolve through later activities.

Do not implement future UI requirements before their corresponding tickets are released.

## Public Assets

Location:

```text
public/
```

Contains browser-accessible static resources such as:

- CSS
- images
- client-side assets

## Tests

Location:

```text
test/
```

The starter repository currently uses:

```text
test/application.test.js
```

The project uses the Node.js built-in test runner and Supertest.

The test structure may evolve as the application becomes larger.

Students should follow the testing structure established by the current repository and ticket rather than reorganizing it without a requirement.

## Request Flow

A typical future request flow may be:

```text
HTTP Request

Route

Controller

Service

Repository

Model / Data Source

HTTP Response or EJS View
```

The sequence should be understood as a responsibility flow, not as a requirement that every request must use every layer.

For simple endpoints, fewer layers may be appropriate.

## Current Endpoints

The starter application provides:

```text
GET /
GET /health
```

Unknown routes return HTTP 404.

## Domain Models

A domain model represents meaningful concepts from the application problem domain.

Students should distinguish between:

- representing an object
- validating an object
- processing an object
- persisting an object
- retrieving an object
- displaying an object

These are related but different responsibilities.

A ticket that introduces a domain model does not automatically require persistence, controllers, routes, or user interface functionality.

## Validation

Validation protects the application from invalid input.

Validation requirements will be introduced progressively.

Place validation in the location required by the current architecture and activity rather than duplicating validation logic throughout the application.

## Persistence

Database or other persistence mechanisms will be introduced when required by the semester activities.

The existence of a repository or model file does not mean persistence is already implemented.

## Dependency Direction

Prefer clear responsibility boundaries.

For example:

```text
Controller depends on Service
Service depends on Repository
Repository works with persistence or data
Model represents domain information
```

Avoid unnecessary coupling between unrelated components.

## Testing Architecture

Every implemented requirement should be verifiable.

Students should create or update automated tests as instructed by each activity.

Before submitting work, run:

```bash
npm test
```

The goal is not merely to make tests pass.

Students should understand what each test verifies and why the behavior is required.

## Architecture Evolution

This architecture is intentionally introduced progressively.

Do not create unnecessary:

- controllers
- repositories
- services
- database structures
- endpoints
- middleware
- views
- utilities

before they are required.

The repository should evolve together with the semester activities.