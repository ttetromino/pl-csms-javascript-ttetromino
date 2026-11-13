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
import { setServiceRequestDatabase } from "../src/controllers/serviceRequestController.js";
import { setDatabase } from "../src/controllers/residentController.js";

describe("Service Request Management Interface", () => {
  let app;
  let db;
  let tempDbPath;
  let residentRepository;
  let serviceRequestRepository;

  // Helpers
  function makeResident(overrides = {}) {
    return residentRepository.save(new Resident({
      firstName: overrides.firstName || "Juan",
      lastName: overrides.lastName || "Dela Cruz",
      address: overrides.address || "123 Rizal St",
      contactNumber: overrides.contactNumber || "09123456789",
      email: overrides.email || "juan@example.com",
      status: overrides.status || "Active"
    }));
  }

  function makeServiceRequest(residentId, overrides = {}) {
    return serviceRequestRepository.save(new ServiceRequest({
      residentId,
      serviceType: overrides.serviceType || "Barangay Clearance",
      description: overrides.description || "Requesting clearance for employment",
      dateRequested: overrides.dateRequested || "2024-01-15",
      status: overrides.status || "Pending"
    }));
  }

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-sr-${Date.now()}.sqlite`);
    db = createDatabase(tempDbPath);
    residentRepository = new ResidentRepository(db);
    serviceRequestRepository = new ServiceRequestRepository(db);
    setDatabase(db);
    setServiceRequestDatabase(db);
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

  // Test 1
  describe("Test 1 - Service Request Management Page Loads", () => {
    it("should load the Service Request Management page", async () => {
      const response = await request(app).get("/service-requests");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Service Request Management"));
    });
  });

  // Test 2
  describe("Test 2 - Persisted Service Requests Are Displayed", () => {
    it("should display all persisted service requests", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { serviceType: "Medical Assistance" });
      makeServiceRequest(resident.id, { serviceType: "Housing Support" });

      const response = await request(app).get("/service-requests");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Medical Assistance"));
      assert.ok(response.text.includes("Housing Support"));
    });
  });

  // Test 3
  describe("Test 3 - Required Ordering Is Preserved", () => {
    it("should display service requests ordered by dateRequested DESC then id DESC", async () => {
      const resident = makeResident();
      const sr1 = makeServiceRequest(resident.id, { serviceType: "Older Request", dateRequested: "2024-01-01" });
      const sr2 = makeServiceRequest(resident.id, { serviceType: "Newer Request", dateRequested: "2024-06-01" });

      const response = await request(app).get("/service-requests");
      assert.strictEqual(response.status, 200);

      const newerPos = response.text.indexOf("Newer Request");
      const olderPos = response.text.indexOf("Older Request");
      assert.ok(newerPos < olderPos, "Newer request should appear before older request");
    });
  });

  // Test 4
  describe("Test 4 - Text Search Uses T11 Behavior", () => {
    it("should return matching requests and exclude non-matching ones", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { serviceType: "Barangay Clearance", description: "For employment" });
      makeServiceRequest(resident.id, { serviceType: "Medical Assistance", description: "Eye checkup" });

      const response = await request(app).get("/service-requests?search=clearance");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Barangay Clearance"));
      assert.ok(!response.text.includes("Medical Assistance"));
    });
  });

  // Test 5
  describe("Test 5 - Status Filter Uses T11 Behavior", () => {
    it("should display only requests matching the selected status", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { serviceType: "Pending Request", status: "Pending" });
      makeServiceRequest(resident.id, { serviceType: "Done Request", status: "Completed" });

      const response = await request(app).get("/service-requests?status=Pending");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Pending Request"));
      assert.ok(!response.text.includes("Done Request"));
    });
  });

  // Test 6
  describe("Test 6 - Combined Search and Status Filter Works", () => {
    it("should return only requests matching both search and status", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { serviceType: "Clearance Pending", description: "For work", status: "Pending" });
      makeServiceRequest(resident.id, { serviceType: "Clearance Completed", description: "For school", status: "Completed" });
      makeServiceRequest(resident.id, { serviceType: "Housing Support", description: "Assistance", status: "Pending" });

      const response = await request(app).get("/service-requests?search=clearance&status=Pending");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Clearance Pending"));
      assert.ok(!response.text.includes("Clearance Completed"));
      assert.ok(!response.text.includes("Housing Support"));
    });
  });

  // Test 7
  describe("Test 7 - Submission Form Is Accessible", () => {
    it("should render the submission form with required fields and no ID/status input", async () => {
      const response = await request(app).get("/service-requests/new");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Submit Service Request"));
      assert.ok(response.text.includes("Resident ID"));
      assert.ok(response.text.includes("Service Type"));
      assert.ok(response.text.includes("Description"));
      assert.ok(response.text.includes("Date Requested"));
      // No manual ID or status input
      assert.ok(!response.text.includes('name="id"'));
      assert.ok(!response.text.includes('name="status"'));
    });
  });

  // Test 8
  describe("Test 8 - Valid Submission Persists a Pending Request", () => {
    it("should persist a service request with Pending status and generated ID", async () => {
      const resident = makeResident();

      const response = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: String(resident.id),
          serviceType: "Barangay Clearance",
          description: "Needed for employment",
          dateRequested: "2024-03-10"
        });

      assert.strictEqual(response.status, 302);

      const all = serviceRequestRepository.findAll();
      assert.strictEqual(all.length, 1);
      const sr = all[0];
      assert.ok(sr.id > 0);
      assert.strictEqual(sr.residentId, resident.id);
      assert.strictEqual(sr.serviceType, "Barangay Clearance");
      assert.strictEqual(sr.description, "Needed for employment");
      assert.strictEqual(sr.dateRequested, "2024-03-10");
      assert.strictEqual(sr.status, "Pending");
    });
  });

  // Test 9
  describe("Test 9 - Invalid Submission Shows Validation Feedback", () => {
    it("should show validation errors and not persist", async () => {
      const response = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: "1",
          serviceType: "",
          description: "",
          dateRequested: "not-a-date"
        });

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Service type is required"));

      const all = serviceRequestRepository.findAll();
      assert.strictEqual(all.length, 0);
    });
  });

  // Test 10
  describe("Test 10 - Missing Resident Submission Is Rejected", () => {
    it("should show resident-not-found feedback and not persist", async () => {
      const response = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: "9999",
          serviceType: "Medical Assistance",
          description: "Eye checkup needed",
          dateRequested: "2024-03-10"
        });

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Resident not found"));

      const all = serviceRequestRepository.findAll();
      assert.strictEqual(all.length, 0);
    });
  });

  // Test 11
  describe("Test 11 - Inactive Resident Submission Is Rejected", () => {
    it("should show eligibility feedback and not persist", async () => {
      const resident = makeResident({ status: "Inactive" });

      const response = await request(app)
        .post("/service-requests/new")
        .type("form")
        .send({
          residentId: String(resident.id),
          serviceType: "Medical Assistance",
          description: "Checkup needed",
          dateRequested: "2024-03-10"
        });

      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("Inactive Residents cannot submit"));

      const all = serviceRequestRepository.findAll();
      assert.strictEqual(all.length, 0);
    });
  });

  // Test 12
  describe("Test 12 - Existing Service Request Details Can Be Viewed", () => {
    it("should display all fields of a persisted service request", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id, {
        serviceType: "Housing Support",
        description: "Need roof repair assistance",
        dateRequested: "2024-04-20"
      });

      const response = await request(app).get(`/service-requests/${sr.id}`);
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes(String(sr.id)));
      assert.ok(response.text.includes(String(resident.id)));
      assert.ok(response.text.includes("Housing Support"));
      assert.ok(response.text.includes("Need roof repair assistance"));
      assert.ok(response.text.includes("2024-04-20"));
      assert.ok(response.text.includes("Pending"));
    });
  });

  // Test 13
  describe("Test 13 - Missing Service Request View Is Handled Safely", () => {
    it("should return a controlled 404 for a nonexistent service request", async () => {
      const response = await request(app).get("/service-requests/9999");
      assert.strictEqual(response.status, 404);
      assert.ok(response.text.includes("not found") || response.text.includes("Error"));
    });
  });

  // Test 14
  describe("Test 14 - Pending Request Can Start Processing", () => {
    it("should transition Pending to In Progress", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id);

      const response = await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "In Progress" });

      assert.strictEqual(response.status, 302);

      const updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "In Progress");
    });
  });

  // Test 15
  describe("Test 15 - Pending Request Can Be Cancelled", () => {
    it("should transition Pending to Cancelled", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id);

      const response = await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Cancelled" });

      assert.strictEqual(response.status, 302);

      const updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "Cancelled");
    });
  });

  // Test 16
  describe("Test 16 - In-Progress Request Can Be Completed", () => {
    it("should transition In Progress to Completed", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id, { status: "In Progress" });

      const response = await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Completed" });

      assert.strictEqual(response.status, 302);

      const updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "Completed");
    });
  });

  // Test 17
  describe("Test 17 - In-Progress Request Can Be Cancelled", () => {
    it("should transition In Progress to Cancelled", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id, { status: "In Progress" });

      const response = await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Cancelled" });

      assert.strictEqual(response.status, 302);

      const updated = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(updated.status, "Cancelled");
    });
  });

  // Test 18
  describe("Test 18 - Invalid Direct Transition Is Still Rejected", () => {
    it("should reject Pending to Completed transition and not modify persistence", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id);

      await request(app)
        .post(`/service-requests/${sr.id}/status`)
        .type("form")
        .send({ requestedStatus: "Completed" });

      const unchanged = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(unchanged.status, "Pending");
    });
  });

  // Test 19
  describe("Test 19 - Completed and Cancelled Requests Remain Visible", () => {
    it("should list and allow viewing terminal service requests", async () => {
      const resident = makeResident();
      const completed = makeServiceRequest(resident.id, { serviceType: "Completed Job", status: "Completed" });
      const cancelled = makeServiceRequest(resident.id, { serviceType: "Cancelled Job", status: "Cancelled" });

      const listResponse = await request(app).get("/service-requests");
      assert.strictEqual(listResponse.status, 200);
      assert.ok(listResponse.text.includes("Completed Job"));
      assert.ok(listResponse.text.includes("Cancelled Job"));

      const completedResponse = await request(app).get(`/service-requests/${completed.id}`);
      assert.strictEqual(completedResponse.status, 200);
      assert.ok(completedResponse.text.includes("Completed"));

      const cancelledResponse = await request(app).get(`/service-requests/${cancelled.id}`);
      assert.strictEqual(cancelledResponse.status, 200);
      assert.ok(cancelledResponse.text.includes("Cancelled"));

      // Filter by terminal status
      const filterResponse = await request(app).get("/service-requests?status=Completed");
      assert.strictEqual(filterResponse.status, 200);
      assert.ok(filterResponse.text.includes("Completed Job"));
      assert.ok(!filterResponse.text.includes("Cancelled Job"));
    });
  });

  // Test 20
  describe("Test 20 - GET Requests Do Not Change Service Request State", () => {
    it("should not alter status or create requests on GET operations", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id);

      await request(app).get("/service-requests");
      await request(app).get("/service-requests/new");
      await request(app).get(`/service-requests/${sr.id}`);
      await request(app).get("/service-requests?search=clearance");
      await request(app).get("/service-requests?status=Pending");

      const unchanged = serviceRequestRepository.findById(sr.id);
      assert.strictEqual(unchanged.status, "Pending");

      const all = serviceRequestRepository.findAll();
      assert.strictEqual(all.length, 1);
    });
  });
});
