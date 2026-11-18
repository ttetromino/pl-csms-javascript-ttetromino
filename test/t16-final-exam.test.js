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

describe("T16 Final Examination", () => {
  let app;
  let db;
  let tempDbPath;
  let residentRepository;
  let serviceRequestRepository;

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-t16-${Date.now()}.sqlite`);
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

  // Part G: Automated release-version verification
  describe("Release Version Verification", () => {
    it("should report version 1.0.0 in /health endpoint", async () => {
      const response = await request(app).get("/health");

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.status, "ok");
      assert.strictEqual(response.body.application, "CSMS");
      assert.strictEqual(response.body.version, "1.0.0");
    });

    it("should display v1.0.0 in the browser interface", async () => {
      const response = await request(app).get("/dashboard");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("v1.0.0"));
    });

    it("should display v1.0.0 on the home page", async () => {
      const response = await request(app).get("/");

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("1.0.0"));
    });

    it("should not expose sensitive information in /health", async () => {
      const response = await request(app).get("/health");
      const body = JSON.stringify(response.body);

      assert.ok(!body.includes("password"));
      assert.ok(!body.includes("token"));
      assert.ok(!body.includes("secret"));
      assert.ok(!body.includes("key"));
      assert.ok(!body.includes("database"));
    });
  });

  // Part F: Final Examination Integration Test
  describe("Resident lifecycle and Service Request eligibility and Dashboard aggregation integration", () => {
    it("should reflect resident deactivation in service request eligibility and dashboard counts", async () => {
      // --- Module 1: Resident Registration (T04) ---
      // Register an Active Resident through the presentation layer
      const regResponse = await request(app)
        .post("/residents/register")
        .type("form")
        .send({
          firstName: "Integration",
          lastName: "Test",
          address: "100 Final St",
          contactNumber: "09123456789",
          email: "integration@test.com"
        });

      assert.strictEqual(regResponse.status, 302);

      const residents = residentRepository.findAll();
      assert.strictEqual(residents.length, 1);
      const resident = residents[0];
      assert.strictEqual(resident.status, "Active");
      assert.ok(resident.id > 0);

      // --- Module 2: Service Request Submission (T09) ---
      // Submit a Service Request for the Active Resident
      const submitResponse = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: String(resident.id),
          serviceType: "Barangay Clearance",
          description: "Needed for employment application",
          dateRequested: "2024-08-01"
        });

      assert.strictEqual(submitResponse.status, 302);

      const serviceRequests = serviceRequestRepository.findAll();
      assert.strictEqual(serviceRequests.length, 1);
      const sr = serviceRequests[0];
      assert.strictEqual(sr.status, "Pending");
      assert.strictEqual(sr.residentId, resident.id);

      // --- Module 3: Dashboard Aggregation (T14) ---
      // Verify dashboard reflects 1 Active resident and 1 Pending request
      assert.strictEqual(residentRepository.countAll(), 1);
      assert.strictEqual(residentRepository.countByStatus("Active"), 1);
      assert.strictEqual(residentRepository.countByStatus("Inactive"), 0);
      assert.strictEqual(serviceRequestRepository.countAll(), 1);
      assert.strictEqual(serviceRequestRepository.countByStatus("Pending"), 1);
      assert.strictEqual(
        serviceRequestRepository.countByStatus("Pending") +
        serviceRequestRepository.countByStatus("In Progress"),
        1
      ); // Open = 1

      // --- Module 1 (again): Resident Deactivation (T07) ---
      // Deactivate the Resident through the presentation layer
      const deactResponse = await request(app)
        .post(`/residents/${resident.id}/deactivate`)
        .type("form");

      assert.strictEqual(deactResponse.status, 302);

      // Verify the resident is now Inactive but still persisted
      const deactivated = residentRepository.findById(resident.id);
      assert.strictEqual(deactivated.status, "Inactive");
      assert.strictEqual(residentRepository.countAll(), 1);

      // --- Module 2 (again): Service Request Eligibility (T09) ---
      // Attempt to submit a new Service Request for the now-Inactive Resident
      const blockedResponse = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: String(resident.id),
          serviceType: "Medical Assistance",
          description: "Should be blocked",
          dateRequested: "2024-08-02"
        });

      assert.strictEqual(blockedResponse.status, 200);
      assert.ok(blockedResponse.text.includes("Inactive Residents cannot submit"));

      // Verify no second Service Request was persisted
      assert.strictEqual(serviceRequestRepository.countAll(), 1);

      // --- Module 3 (again): Dashboard reflects deactivation ---
      assert.strictEqual(residentRepository.countByStatus("Active"), 0);
      assert.strictEqual(residentRepository.countByStatus("Inactive"), 1);
      assert.strictEqual(residentRepository.countAll(), 1);

      // --- Module 2 (final): Service Request Workflow (T10) ---
      // Transition the existing Pending request to In Progress, then Completed
      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "In Progress" });

      let updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "In Progress");

      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Completed" });

      updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "Completed");

      // --- Module 3 (final): Dashboard reflects completed workflow ---
      assert.strictEqual(serviceRequestRepository.countByStatus("Pending"), 0);
      assert.strictEqual(serviceRequestRepository.countByStatus("In Progress"), 0);
      assert.strictEqual(serviceRequestRepository.countByStatus("Completed"), 1);
      assert.strictEqual(serviceRequestRepository.countAll(), 1);
      // Open should now be 0 since the only request is Completed
      assert.strictEqual(
        serviceRequestRepository.countByStatus("Pending") +
        serviceRequestRepository.countByStatus("In Progress"),
        0
      );
    });
  });
});
