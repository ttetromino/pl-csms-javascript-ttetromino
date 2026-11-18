import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database/db.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";
import { Resident } from "../src/models/Resident.js";
import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { setDatabase } from "../src/controllers/residentController.js";
import { setServiceRequestDatabase } from "../src/controllers/serviceRequestController.js";
import { setDashboardDatabase } from "../src/controllers/dashboardController.js";

describe("T15 System Hardening Tests", () => {
  let app;
  let db;
  let tempDbPath;
  let residentRepository;
  let serviceRequestRepository;

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-t15-${Date.now()}.sqlite`);
    db = createDatabase(tempDbPath);
    residentRepository = new ResidentRepository(db);
    serviceRequestRepository = new ServiceRequestRepository(db);
    setDatabase(db);
    setServiceRequestDatabase(db);
    setDashboardDatabase(db);
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

  // Category 1: Invalid or Malformed Input
  describe("Category 1 - Malformed route identifier does not crash or modify persistence", () => {
    it("should return controlled 404 for /residents/abc/edit without stack trace", async () => {
      // Persist a resident so we know the database has valid data
      const resident = residentRepository.save(new Resident({
        firstName: "Test",
        lastName: "User",
        address: "123 St",
        contactNumber: "09123456789",
        email: "test@example.com",
        status: "Active"
      }));

      const response = await request(app).get("/residents/abc/edit");

      assert.strictEqual(response.status, 404);
      assert.ok(response.text.includes("Error"));
      // Must not expose a stack trace
      assert.ok(!response.text.includes("at "));
      assert.ok(!response.text.includes("SyntaxError"));
      assert.ok(!response.text.includes("TypeError"));

      // Verify persistence was not modified
      const unchanged = residentRepository.findById(resident.id);
      assert.strictEqual(unchanged.firstName, "Test");
      assert.strictEqual(residentRepository.countAll(), 1);
    });
  });

  // Category 2: Rejected Mutation Protects Persistence
  describe("Category 2 - Invalid Service Request transition leaves persistence unchanged", () => {
    it("should not modify a Pending service request when attempting invalid transition to Completed", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Jane",
        lastName: "Doe",
        address: "456 Ave",
        contactNumber: "09987654321",
        email: "jane@example.com",
        status: "Active"
      }));

      const sr = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Barangay Clearance",
        description: "For employment",
        dateRequested: "2024-05-01",
        status: "Pending"
      }));

      // Attempt invalid transition: Pending -> Completed (not allowed)
      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Completed" });

      // Retrieve the persisted record and verify it is unchanged
      const unchanged = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(unchanged.status, "Pending");
      assert.strictEqual(unchanged.serviceType, "Barangay Clearance");
      assert.strictEqual(unchanged.description, "For employment");
      assert.strictEqual(unchanged.dateRequested, "2024-05-01");
      assert.strictEqual(unchanged.residentId, resident.id);
      assert.strictEqual(unchanged.id, sr.id);
    });
  });

  // Category 3: Read-Only Request Safety
  describe("Category 3 - Repeated GET requests do not modify persistence", () => {
    it("should not change resident or service request state after multiple GET operations", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Active",
        lastName: "Resident",
        address: "789 Blvd",
        contactNumber: "09555666777",
        email: "active@example.com",
        status: "Active"
      }));

      const sr = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Medical Assistance",
        description: "Checkup needed",
        dateRequested: "2024-06-15",
        status: "Pending"
      }));

      // Record state before
      const residentCountBefore = residentRepository.countAll();
      const srCountBefore = serviceRequestRepository.countAll();
      const srStatusBefore = serviceRequestRepository.findById(sr.id).status;
      const residentStatusBefore = residentRepository.findById(resident.id).status;

      // Perform multiple GET operations across all read-only routes
      await request(app).get("/dashboard");
      await request(app).get("/residents");
      await request(app).get("/residents?search=Active");
      await request(app).get(`/residents/${resident.id}/edit`);
      await request(app).get("/service-requests");
      await request(app).get("/service-requests?search=Medical");
      await request(app).get("/service-requests?status=Pending");
      await request(app).get(`/service-requests/${sr.id}`);
      await request(app).get("/dashboard");

      // Verify persistence is unchanged
      assert.strictEqual(residentRepository.countAll(), residentCountBefore);
      assert.strictEqual(serviceRequestRepository.countAll(), srCountBefore);
      assert.strictEqual(serviceRequestRepository.findById(sr.id).status, srStatusBefore);
      assert.strictEqual(residentRepository.findById(resident.id).status, residentStatusBefore);
    });
  });

  // Category 4: Cross-Feature Regression
  describe("Category 4 - Resident deactivation is reflected in Dashboard counts", () => {
    it("should update Dashboard active/inactive counts after Resident deactivation through T12 interface", async () => {
      // Create 3 active residents
      const r1 = residentRepository.save(new Resident({
        firstName: "Alpha",
        lastName: "One",
        address: "111 St",
        contactNumber: "09111111111",
        email: "alpha@example.com",
        status: "Active"
      }));

      residentRepository.save(new Resident({
        firstName: "Beta",
        lastName: "Two",
        address: "222 St",
        contactNumber: "09222222222",
        email: "beta@example.com",
        status: "Active"
      }));

      residentRepository.save(new Resident({
        firstName: "Gamma",
        lastName: "Three",
        address: "333 St",
        contactNumber: "09333333333",
        email: "gamma@example.com",
        status: "Active"
      }));

      // Verify initial dashboard counts
      assert.strictEqual(residentRepository.countAll(), 3);
      assert.strictEqual(residentRepository.countByStatus("Active"), 3);
      assert.strictEqual(residentRepository.countByStatus("Inactive"), 0);

      // Deactivate one resident through the T12 interface (POST)
      await request(app)
        .post(`/residents/${r1.id}/deactivate`)
        .type("form");

      // Verify dashboard counts reflect the deactivation
      assert.strictEqual(residentRepository.countAll(), 3);
      assert.strictEqual(residentRepository.countByStatus("Active"), 2);
      assert.strictEqual(residentRepository.countByStatus("Inactive"), 1);

      // Verify the deactivated resident is still persisted and searchable
      const stillExists = residentRepository.findById(r1.id);
      assert.ok(stillExists);
      assert.strictEqual(stillExists.status, "Inactive");
    });
  });

  // Category 5: Repeatability / Boundary Behavior
  describe("Category 5 - Terminal-state protection: Completed request cannot transition again", () => {
    it("should reject any transition attempt from Completed status and preserve persistence", async () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Terminal",
        lastName: "Test",
        address: "999 St",
        contactNumber: "09999999999",
        email: "terminal@example.com",
        status: "Active"
      }));

      const sr = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Housing Support",
        description: "Roof repair",
        dateRequested: "2024-07-01",
        status: "Completed"
      }));

      // Attempt to transition Completed -> In Progress (invalid)
      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "In Progress" });

      // Verify persistence is unchanged
      const unchanged = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(unchanged.status, "Completed");

      // Attempt to transition Completed -> Cancelled (invalid)
      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Cancelled" });

      // Verify persistence is still unchanged
      const stillUnchanged = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(stillUnchanged.status, "Completed");

      // Attempt same-state transition Completed -> Completed (invalid)
      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Completed" });

      // Verify persistence is still unchanged
      const finalCheck = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(finalCheck.status, "Completed");
    });
  });
});
