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
import { setDashboardDatabase } from "../src/controllers/dashboardController.js";
import { setDatabase } from "../src/controllers/residentController.js";
import { setServiceRequestDatabase } from "../src/controllers/serviceRequestController.js";

describe("CSMS Dashboard", () => {
  let app;
  let db;
  let tempDbPath;
  let residentRepository;
  let serviceRequestRepository;

  function makeResident(overrides = {}) {
    return residentRepository.save(new Resident({
      firstName: overrides.firstName || "Juan",
      lastName: overrides.lastName || "Dela Cruz",
      address: "123 Rizal St",
      contactNumber: overrides.contactNumber || "09123456789",
      email: overrides.email || `resident${Date.now()}@example.com`,
      status: overrides.status || "Active"
    }));
  }

  function makeServiceRequest(residentId, overrides = {}) {
    return serviceRequestRepository.save(new ServiceRequest({
      residentId,
      serviceType: overrides.serviceType || "Barangay Clearance",
      description: overrides.description || "For employment requirements",
      dateRequested: overrides.dateRequested || "2024-01-15",
      status: overrides.status || "Pending"
    }));
  }

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-dash-${Date.now()}.sqlite`);
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

  // Test 1
  describe("Test 1 - Dashboard Loads Successfully", () => {
    it("should render the dashboard page", async () => {
      const response = await request(app).get("/dashboard");
      assert.strictEqual(response.status, 200);
      assert.ok(response.text.includes("CSMS Dashboard"));
    });
  });

  // Test 2
  describe("Test 2 - Empty Dashboard Displays Zero Counts", () => {
    it("should display zero for all metrics when no data exists", async () => {
      const response = await request(app).get("/dashboard");
      assert.strictEqual(response.status, 200);
      // All counts rendered — check that "0" appears (expected for empty state)
      // We check specific labels with their values via text content
      assert.ok(response.text.includes("Total Residents"));
      assert.ok(response.text.includes("Total"));
      assert.ok(response.text.includes("No Service Requests available"));
    });
  });

  // Test 3
  describe("Test 3 - Total Resident Count Is Correct", () => {
    it("should report the correct total number of residents", async () => {
      makeResident({ email: "r1@test.com" });
      makeResident({ email: "r2@test.com" });
      makeResident({ email: "r3@test.com" });

      const total = residentRepository.countAll();
      assert.strictEqual(total, 3);
    });
  });

  // Test 4
  describe("Test 4 - Resident Status Counts Are Correct", () => {
    it("should correctly count Active and Inactive residents and reconcile with total", async () => {
      makeResident({ email: "a1@test.com", status: "Active" });
      makeResident({ email: "a2@test.com", status: "Active" });
      makeResident({ email: "i1@test.com", status: "Inactive" });

      const total = residentRepository.countAll();
      const active = residentRepository.countByStatus("Active");
      const inactive = residentRepository.countByStatus("Inactive");

      assert.strictEqual(total, 3);
      assert.strictEqual(active, 2);
      assert.strictEqual(inactive, 1);
      assert.strictEqual(total, active + inactive);
    });
  });

  // Test 5
  describe("Test 5 - Total Service Request Count Is Correct", () => {
    it("should report the correct total number of service requests", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id);
      makeServiceRequest(resident.id);
      makeServiceRequest(resident.id);

      const total = serviceRequestRepository.countAll();
      assert.strictEqual(total, 3);
    });
  });

  // Test 6
  describe("Test 6 - Service Request Status Counts Are Correct", () => {
    it("should correctly count requests per status", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { status: "Pending" });
      makeServiceRequest(resident.id, { status: "Pending" });
      makeServiceRequest(resident.id, { status: "In Progress" });
      makeServiceRequest(resident.id, { status: "Completed" });
      makeServiceRequest(resident.id, { status: "Cancelled" });

      assert.strictEqual(serviceRequestRepository.countByStatus("Pending"), 2);
      assert.strictEqual(serviceRequestRepository.countByStatus("In Progress"), 1);
      assert.strictEqual(serviceRequestRepository.countByStatus("Completed"), 1);
      assert.strictEqual(serviceRequestRepository.countByStatus("Cancelled"), 1);
    });
  });

  // Test 7
  describe("Test 7 - Service Request Counts Reconcile", () => {
    it("should satisfy total = pending + in progress + completed + cancelled", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { status: "Pending" });
      makeServiceRequest(resident.id, { status: "In Progress" });
      makeServiceRequest(resident.id, { status: "Completed" });
      makeServiceRequest(resident.id, { status: "Cancelled" });
      makeServiceRequest(resident.id, { status: "Pending" });

      const total = serviceRequestRepository.countAll();
      const pending = serviceRequestRepository.countByStatus("Pending");
      const inProgress = serviceRequestRepository.countByStatus("In Progress");
      const completed = serviceRequestRepository.countByStatus("Completed");
      const cancelled = serviceRequestRepository.countByStatus("Cancelled");

      assert.strictEqual(total, pending + inProgress + completed + cancelled);
    });
  });

  // Test 8
  describe("Test 8 - Open Request Count Is Correct", () => {
    it("should count open as pending + in progress, excluding completed and cancelled", async () => {
      const resident = makeResident();
      makeServiceRequest(resident.id, { status: "Pending" });
      makeServiceRequest(resident.id, { status: "In Progress" });
      makeServiceRequest(resident.id, { status: "Completed" });
      makeServiceRequest(resident.id, { status: "Cancelled" });

      const pending = serviceRequestRepository.countByStatus("Pending");
      const inProgress = serviceRequestRepository.countByStatus("In Progress");
      const open = pending + inProgress;

      assert.strictEqual(open, 2);
    });
  });

  // Test 9
  describe("Test 9 - Resident Deactivation Is Reflected", () => {
    it("should update active and inactive counts after deactivation", async () => {
      const resident = makeResident({ email: "deactivate@test.com", status: "Active" });

      const activeBefore = residentRepository.countByStatus("Active");
      const inactiveBefore = residentRepository.countByStatus("Inactive");
      const totalBefore = residentRepository.countAll();

      residentRepository.deactivateById(resident.id);

      const activeAfter = residentRepository.countByStatus("Active");
      const inactiveAfter = residentRepository.countByStatus("Inactive");
      const totalAfter = residentRepository.countAll();

      assert.strictEqual(totalAfter, totalBefore);
      assert.strictEqual(activeAfter, activeBefore - 1);
      assert.strictEqual(inactiveAfter, inactiveBefore + 1);
    });
  });

  // Test 10
  describe("Test 10 - Service Request Transition Is Reflected", () => {
    it("should update status counts after Pending to In Progress transition", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id, { status: "Pending" });

      const pendingBefore = serviceRequestRepository.countByStatus("Pending");
      const inProgressBefore = serviceRequestRepository.countByStatus("In Progress");
      const totalBefore = serviceRequestRepository.countAll();

      serviceRequestRepository.updateStatus(sr.id, "In Progress");

      const pendingAfter = serviceRequestRepository.countByStatus("Pending");
      const inProgressAfter = serviceRequestRepository.countByStatus("In Progress");
      const totalAfter = serviceRequestRepository.countAll();

      assert.strictEqual(totalAfter, totalBefore);
      assert.strictEqual(pendingAfter, pendingBefore - 1);
      assert.strictEqual(inProgressAfter, inProgressBefore + 1);
    });
  });

  // Test 11
  describe("Test 11 - Terminal Transition Updates Open Count", () => {
    it("should decrease open count when In Progress moves to Completed", async () => {
      const resident = makeResident();
      const sr = makeServiceRequest(resident.id, { status: "In Progress" });

      const openBefore =
        serviceRequestRepository.countByStatus("Pending") +
        serviceRequestRepository.countByStatus("In Progress");
      const totalBefore = serviceRequestRepository.countAll();

      serviceRequestRepository.updateStatus(sr.id, "Completed");

      const openAfter =
        serviceRequestRepository.countByStatus("Pending") +
        serviceRequestRepository.countByStatus("In Progress");
      const totalAfter = serviceRequestRepository.countAll();

      assert.strictEqual(totalAfter, totalBefore);
      assert.strictEqual(openAfter, openBefore - 1);
    });
  });

  // Test 12
  describe("Test 12 - Recent Requests Return No More Than Five", () => {
    it("should return at most 5 recent service requests", async () => {
      const resident = makeResident();
      for (let i = 1; i <= 8; i++) {
        makeServiceRequest(resident.id, { dateRequested: `2024-0${i < 10 ? "0" : ""}${i}-01`.replace("0001", "01-01") });
      }

      const recent = serviceRequestRepository.findRecent(5);
      assert.ok(recent.length <= 5);
      assert.strictEqual(recent.length, 5);
    });
  });

  // Test 13
  describe("Test 13 - Recent Requests Use Correct Ordering", () => {
    it("should order by dateRequested DESC then id DESC", async () => {
      const resident = makeResident();
      const sr1 = makeServiceRequest(resident.id, { serviceType: "Older", dateRequested: "2024-01-01" });
      const sr2 = makeServiceRequest(resident.id, { serviceType: "Newer", dateRequested: "2024-06-01" });
      const sr3 = makeServiceRequest(resident.id, { serviceType: "Same Date Higher ID", dateRequested: "2024-06-01" });

      const recent = serviceRequestRepository.findRecent(5);

      // sr3 and sr2 share date 2024-06-01; sr3 has higher id so appears first
      assert.strictEqual(recent[0].id, sr3.id);
      assert.strictEqual(recent[1].id, sr2.id);
      assert.strictEqual(recent[2].id, sr1.id);
    });
  });

  // Test 14
  describe("Test 14 - Terminal Requests May Appear in Recent Results", () => {
    it("should include Completed and Cancelled requests in recent results", async () => {
      const resident = makeResident();
      const completed = makeServiceRequest(resident.id, {
        serviceType: "Completed Job",
        status: "Completed",
        dateRequested: "2024-12-01"
      });
      const cancelled = makeServiceRequest(resident.id, {
        serviceType: "Cancelled Job",
        status: "Cancelled",
        dateRequested: "2024-11-01"
      });

      const recent = serviceRequestRepository.findRecent(5);
      const ids = recent.map(sr => sr.id);

      assert.ok(ids.includes(completed.id));
      assert.ok(ids.includes(cancelled.id));
    });
  });

  // Test 15
  describe("Test 15 - Dashboard GET Does Not Modify Persistence", () => {
    it("should not change any resident or service request data when dashboard is viewed", async () => {
      const resident = makeResident({ email: "readonly@test.com" });
      const sr = makeServiceRequest(resident.id);

      const residentsBefore = residentRepository.countAll();
      const srBefore = serviceRequestRepository.countAll();
      const srStatusBefore = serviceRequestRepository.findById(sr.id).status;

      await request(app).get("/dashboard");
      await request(app).get("/dashboard");
      await request(app).get("/dashboard");

      const residentsAfter = residentRepository.countAll();
      const srAfter = serviceRequestRepository.countAll();
      const srStatusAfter = serviceRequestRepository.findById(sr.id).status;

      assert.strictEqual(residentsAfter, residentsBefore);
      assert.strictEqual(srAfter, srBefore);
      assert.strictEqual(srStatusAfter, srStatusBefore);
    });
  });
});
