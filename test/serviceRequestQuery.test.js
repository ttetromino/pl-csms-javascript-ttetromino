import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { createDatabase } from "../src/database/db.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";
import { ServiceRequestQueryService } from "../src/services/ServiceRequestQueryService.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { Resident } from "../src/models/Resident.js";
import { ServiceRequest } from "../src/models/ServiceRequest.js";

describe("ServiceRequestQueryService", () => {
  let db;
  let tempDbPath;
  let serviceRequestRepository;
  let residentRepository;
  let queryService;

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `test-db-${Date.now()}.sqlite`);
    db = createDatabase(tempDbPath);
    serviceRequestRepository = new ServiceRequestRepository(db);
    residentRepository = new ResidentRepository(db);
    queryService = new ServiceRequestQueryService(serviceRequestRepository);
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

  describe("listServiceRequests", () => {
    it("should return all service requests ordered by date DESC then id DESC", () => {
      const resident = residentRepository.save(new Resident({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        contactNumber: "555-0001",
        address: "101 Main St",
        status: "Active"
      }));

      const sr1 = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Plumbing",
        description: "Leaky faucet",
        dateRequested: "2024-01-01",
        status: "Pending"
      }));

      const sr2 = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Electrical",
        description: "Outlet not working",
        dateRequested: "2024-01-02",
        status: "In Progress"
      }));

      const sr3 = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "HVAC",
        description: "AC repair",
        dateRequested: "2024-01-02",
        status: "Completed"
      }));

      const results = queryService.listServiceRequests();

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].id, sr3.id);
      assert.strictEqual(results[1].id, sr2.id);
      assert.strictEqual(results[2].id, sr1.id);
    });

    it("should return empty array when no service requests exist", () => {
      const results = queryService.listServiceRequests();
      assert.strictEqual(results.length, 0);
    });
  });

  describe("viewServiceRequest", () => {
    it("should return service request by valid ID", () => {
      const resident = residentRepository.save(new Resident({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        contactNumber: "555-0002",
        address: "102 Main St",
        status: "Active"
      }));

      const sr = serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Plumbing",
        description: "Fix sink",
        dateRequested: "2024-01-03",
        status: "Pending"
      }));

      const result = queryService.viewServiceRequest(sr.id);

      assert.strictEqual(result.id, sr.id);
      assert.strictEqual(result.serviceType, "Plumbing");
      assert.strictEqual(result.description, "Fix sink");
    });

    it("should throw error for non-existent ID", () => {
      assert.throws(
        () => queryService.viewServiceRequest(999),
        { message: "Service request not found" }
      );
    });

    it("should throw error for invalid ID (zero)", () => {
      assert.throws(
        () => queryService.viewServiceRequest(0),
        { message: "Invalid service request ID" }
      );
    });

    it("should throw error for invalid ID (negative)", () => {
      assert.throws(
        () => queryService.viewServiceRequest(-5),
        { message: "Invalid service request ID" }
      );
    });

    it("should throw error for invalid ID (non-number)", () => {
      assert.throws(
        () => queryService.viewServiceRequest("abc"),
        { message: "Invalid service request ID" }
      );
    });
  });

  describe("searchServiceRequests", () => {
    beforeEach(() => {
      const resident = residentRepository.save(new Resident({
        firstName: "Bob",
        lastName: "Jones",
        email: "bob@example.com",
        contactNumber: "555-0003",
        address: "103 Main St",
        status: "Active"
      }));

      serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Plumbing",
        description: "Leaky faucet",
        dateRequested: "2024-01-01",
        status: "Pending"
      }));

      serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Electrical",
        description: "Outlet repair",
        dateRequested: "2024-01-02",
        status: "In Progress"
      }));

      serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "HVAC",
        description: "AC maintenance",
        dateRequested: "2024-01-03",
        status: "Completed"
      }));

      serviceRequestRepository.save(new ServiceRequest({
        residentId: resident.id,
        serviceType: "Plumbing",
        description: "Toilet fix",
        dateRequested: "2024-01-04",
        status: "Pending"
      }));
    });

    it("should search by serviceType case-insensitively", () => {
      const results = queryService.searchServiceRequests("plumbing", null);
      assert.strictEqual(results.length, 2);
      assert.ok(results.every(sr => sr.serviceType === "Plumbing"));
    });

    it("should search by description case-insensitively", () => {
      const results = queryService.searchServiceRequests("REPAIR", null);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].serviceType, "Electrical");
    });

    it("should filter by status", () => {
      const results = queryService.searchServiceRequests(null, "Pending");
      assert.strictEqual(results.length, 2);
      assert.ok(results.every(sr => sr.status === "Pending"));
    });

    it("should combine search term and status filter", () => {
      const results = queryService.searchServiceRequests("Plumbing", "Pending");
      assert.strictEqual(results.length, 2);
      assert.ok(results.every(sr => sr.serviceType === "Plumbing" && sr.status === "Pending"));
    });

    it("should treat blank search term as list all", () => {
      const results = queryService.searchServiceRequests("", null);
      assert.strictEqual(results.length, 4);
    });

    it("should treat whitespace-only search term as list all", () => {
      const results = queryService.searchServiceRequests("   ", null);
      assert.strictEqual(results.length, 4);
    });

    it("should throw error for invalid status filter", () => {
      assert.throws(
        () => queryService.searchServiceRequests(null, "InvalidStatus"),
        { message: "Invalid status filter" }
      );
    });
  });
});
