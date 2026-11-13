import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database/db.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { Resident } from "../src/models/Resident.js";
import { setDatabase } from "../src/controllers/residentController.js";

describe("Resident Management Interface", () => {
  let app;
  let db;
  let tempDbPath;
  let residentRepository;

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-${Date.now()}.sqlite`);
    db = createDatabase(tempDbPath);
    residentRepository = new ResidentRepository(db);
    setDatabase(db);
    app = createApp();
  });

  afterEach(() => {
    try {
      db.close();
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  });

  describe("Test 1 - Resident Management Page Loads Successfully", () => {
    it("should load the Resident Management page", async () => {
      const response = await request(app).get("/residents");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Resident Management"));
    });
  });

  describe("Test 2 - Resident List Displays Persisted Residents", () => {
    it("should display all persisted residents", async () => {
      residentRepository.save(new Resident({
        firstName: "John",
        lastName: "Doe",
        address: "123 Main St",
        contactNumber: "09123456789",
        email: "john@example.com",
        status: "Active"
      }));

      residentRepository.save(new Resident({
        firstName: "Jane",
        lastName: "Smith",
        address: "456 Oak Ave",
        contactNumber: "09987654321",
        email: "jane@example.com",
        status: "Active"
      }));

      const response = await request(app).get("/residents");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("John"));
      assert.ok(response.text.includes("Doe"));
      assert.ok(response.text.includes("Jane"));
      assert.ok(response.text.includes("Smith"));
      assert.ok(response.text.includes("09123456789"));
      assert.ok(response.text.includes("09987654321"));
    });
  });

  describe("Test 3 - Resident Search Uses Existing Search Behavior", () => {
    it("should search residents by partial case-insensitive name", async () => {
      residentRepository.save(new Resident({
        firstName: "Maria",
        lastName: "Santos",
        address: "789 Pine Rd",
        contactNumber: "09111222333",
        email: "maria@example.com",
        status: "Active"
      }));

      residentRepository.save(new Resident({
        firstName: "Carlos",
        lastName: "Garcia",
        address: "321 Elm St",
        contactNumber: "09444555666",
        email: "carlos@example.com",
        status: "Active"
      }));

      const response = await request(app).get("/residents?search=mar");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Maria"));
      assert.ok(!response.text.includes("Carlos"));
    });
  });

  describe("Test 4 - Blank Search Displays All Residents", () => {
    it("should display all residents with blank search", async () => {
      residentRepository.save(new Resident({
        firstName: "Alice",
        lastName: "Johnson",
        address: "111 First St",
        contactNumber: "09777888999",
        email: "alice@example.com",
        status: "Active"
      }));

      residentRepository.save(new Resident({
        firstName: "Bob",
        lastName: "Williams",
        address: "222 Second St",
        contactNumber: "09000111222",
        email: "bob@example.com",
        status: "Active"
      }));

      const response = await request(app).get("/residents?search=");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Alice"));
      assert.ok(response.text.includes("Bob"));
    });
  });

  describe("Test 5 - Registration Form Is Accessible", () => {
    it("should load the registration form with required fields", async () => {
      const response = await request(app).get("/residents/register");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Register Resident"));
      assert.ok(response.text.includes("First Name"));
      assert.ok(response.text.includes("Last Name"));
      assert.ok(response.text.includes("Address"));
      assert.ok(response.text.includes("Contact Number"));
      assert.ok(response.text.includes("Email"));
    });
  });

  describe("Test 6 - Valid Registration Persists Resident", () => {
    it("should persist a valid resident registration", async () => {
      const response = await request(app)
        .post("/residents/register")
        .type("form")
        .send({
          firstName: "David",
          lastName: "Brown",
          address: "333 Third St",
          contactNumber: "09333444555",
          email: "david@example.com"
        });

      assert.strictEqual(response.status, 302);
      assert.ok(response.headers.location.includes("/residents"));

      const residents = residentRepository.findAll();
      const newResident = residents.find(r => r.firstName === "David");

      assert.ok(newResident);
      assert.strictEqual(newResident.lastName, "Brown");
      assert.strictEqual(newResident.status, "Active");
      assert.ok(newResident.id > 0);
    });
  });

  describe("Test 7 - Invalid Registration Shows Validation Feedback and Does Not Persist", () => {
    it("should show validation errors and not persist invalid data", async () => {
      const response = await request(app)
        .post("/residents/register")
        .type("form")
        .send({
          firstName: "",
          lastName: "Test",
          address: "Test Address",
          contactNumber: "invalid",
          email: "notanemail"
        });

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("First name is required"));

      const residents = residentRepository.findAll();
      assert.strictEqual(residents.length, 0);
    });
  });

  describe("Test 8 - Edit Form Displays Existing Resident Information", () => {
    it("should display edit form with existing resident data", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Emma",
        lastName: "Davis",
        address: "444 Fourth St",
        contactNumber: "09666777888",
        email: "emma@example.com",
        status: "Active"
      }));

      const response = await request(app).get(`/residents/${resident.id}/edit`);

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Edit Resident"));
      assert.ok(response.text.includes("Emma"));
      assert.ok(response.text.includes("Davis"));
      assert.ok(response.text.includes("444 Fourth St"));
      assert.ok(response.text.includes("09666777888"));
      assert.ok(response.text.includes("emma@example.com"));
      assert.ok(response.text.includes("Active"));
      assert.ok(response.text.includes("Resident ID"));
      assert.ok(response.text.includes("Status"));
    });
  });

  describe("Test 9 - Valid Update Persists Changes", () => {
    it("should persist valid resident updates", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Frank",
        lastName: "Miller",
        address: "555 Fifth St",
        contactNumber: "09999000111",
        email: "frank@example.com",
        status: "Active"
      }));

      const response = await request(app)
        .post(`/residents/${resident.id}/edit`)
        .type("form")
        .send({
          firstName: "Francis",
          lastName: "Miller",
          address: "555 Fifth Street",
          contactNumber: "09999000222",
          email: "francis@example.com"
        });

      assert.strictEqual(response.status, 302);

      const updated = residentRepository.findById(resident.id);
      assert.strictEqual(updated.firstName, "Francis");
      assert.strictEqual(updated.address, "555 Fifth Street");
      assert.strictEqual(updated.contactNumber, "09999000222");
      assert.strictEqual(updated.id, resident.id);
      assert.strictEqual(updated.status, "Active");
    });
  });

  describe("Test 10 - Invalid Update Does Not Modify Resident", () => {
    it("should show validation errors and not modify resident", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Grace",
        lastName: "Wilson",
        address: "666 Sixth St",
        contactNumber: "09222333444",
        email: "grace@example.com",
        status: "Active"
      }));

      const response = await request(app)
        .post(`/residents/${resident.id}/edit`)
        .type("form")
        .send({
          firstName: "",
          lastName: "Wilson",
          address: "666 Sixth St",
          contactNumber: "invalid",
          email: "notanemail"
        });

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("First name is required"));

      const unchanged = residentRepository.findById(resident.id);
      assert.strictEqual(unchanged.firstName, "Grace");
      assert.strictEqual(unchanged.contactNumber, "09222333444");
      assert.strictEqual(unchanged.email, "grace@example.com");
    });
  });

  describe("Test 11 - Missing Resident Edit Is Handled Safely", () => {
    it("should return not found for nonexistent resident", async () => {
      const response = await request(app).get("/residents/9999/edit");

      assert.strictEqual(response.status, 404);
      assert.ok(response.text.includes("not found") || response.text.includes("Error"));
    });
  });

  describe("Test 12 - Active Resident Can Be Deactivated Through the Interface", () => {
    it("should deactivate an active resident", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Henry",
        lastName: "Taylor",
        address: "777 Seventh St",
        contactNumber: "09555666777",
        email: "henry@example.com",
        status: "Active"
      }));

      const response = await request(app)
        .post(`/residents/${resident.id}/deactivate`);

      assert.strictEqual(response.status, 302);

      const deactivated = residentRepository.findById(resident.id);
      assert.ok(deactivated);
      assert.strictEqual(deactivated.status, "Inactive");
      assert.strictEqual(deactivated.id, resident.id);
      assert.strictEqual(deactivated.firstName, "Henry");
    });
  });

  describe("Test 13 - Inactive Resident Remains Visible", () => {
    it("should display inactive residents in listing and search", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Ivy",
        lastName: "Anderson",
        address: "888 Eighth St",
        contactNumber: "09888999000",
        email: "ivy@example.com",
        status: "Active"
      }));

      residentRepository.deactivateById(resident.id);

      const listResponse = await request(app).get("/residents");
      assert.strictEqual(listResponse.status, 200);
      assert.ok(listResponse.text.includes("Ivy"));
      assert.ok(listResponse.text.includes("Inactive"));

      const searchResponse = await request(app).get("/residents?search=Ivy");
      assert.strictEqual(searchResponse.status, 200);
      assert.ok(searchResponse.text.includes("Ivy"));
      assert.ok(searchResponse.text.includes("Inactive"));
    });
  });

  describe("Test 14 - GET Requests Do Not Deactivate Residents", () => {
    it("should not modify resident status on GET requests", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Jack",
        lastName: "Moore",
        address: "999 Ninth St",
        contactNumber: "09111222333",
        email: "jack@example.com",
        status: "Active"
      }));

      await request(app).get("/residents");
      await request(app).get(`/residents/${resident.id}/edit`);
      await request(app).get("/residents?search=Jack");

      const unchanged = residentRepository.findById(resident.id);
      assert.strictEqual(unchanged.status, "Active");
    });
  });
});
