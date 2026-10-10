import test from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { Resident } from "../src/models/Resident.js";
import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";
import { ServiceRequestValidator } from "../src/services/ServiceRequestValidator.js";
import { ServiceRequestSubmissionService } from "../src/services/ServiceRequestSubmissionService.js";
import { ServiceRequestStatusService } from "../src/services/ServiceRequestStatusService.js";
import { createDatabase } from "../src/database/db.js";

function createTemporaryDatabasePath() {
  const fileName =
    `csms-t10-${crypto.randomUUID()}.sqlite`;

  return path.join(
    os.tmpdir(),
    fileName
  );
}

function removeDatabase(databasePath) {
  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
  }
}

function createStatusSetup() {
  const databasePath =
    createTemporaryDatabasePath();

  const db = createDatabase(databasePath);

  const residentRepository =
    new ResidentRepository(db);

  const serviceRequestRepository =
    new ServiceRequestRepository(db);

  const validator =
    new ServiceRequestValidator();

  const submissionService =
    new ServiceRequestSubmissionService(
      validator,
      residentRepository,
      serviceRequestRepository
    );

  const statusService =
    new ServiceRequestStatusService(
      serviceRequestRepository
    );

  return {
    databasePath,
    db,
    residentRepository,
    serviceRequestRepository,
    submissionService,
    statusService
  };
}

function cleanupSetup(databasePath, db) {
  if (db && typeof db.close === "function") {
    db.close();
  }

  removeDatabase(databasePath);
}

function makeActiveResident(overrides = {}) {
  return new Resident({
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "Barangay Santo Tomas",
    contactNumber: "09171234567",
    email: "juan@example.com",
    status: "Active",
    ...overrides
  });
}

function submitValidRequest(residentRepository, submissionService, overrides = {}) {
  const resident = makeActiveResident();
  residentRepository.save(resident);

  const request = new ServiceRequest({
    residentId: resident.id,
    serviceType: "Barangay Clearance",
    description: "Requesting barangay clearance for employment.",
    dateRequested: "2026-10-02",
    ...overrides
  });

  const result = submissionService.submitRequest(request);
  return result.serviceRequest;
}

test(
  "Pending can move to In Progress",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      const result = statusService.manageStatus(submitted.id, "In Progress");

      assert.equal(result.success, true);
      assert.ok(result.serviceRequest);
      assert.equal(result.serviceRequest.status, "In Progress");

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "In Progress");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Pending can move to Cancelled",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      const result = statusService.manageStatus(submitted.id, "Cancelled");

      assert.equal(result.success, true);
      assert.equal(result.serviceRequest.status, "Cancelled");

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Cancelled");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "In Progress can move to Completed",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "In Progress");
      const result = statusService.manageStatus(submitted.id, "Completed");

      assert.equal(result.success, true);
      assert.equal(result.serviceRequest.status, "Completed");

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Completed");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "In Progress can move to Cancelled",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "In Progress");
      const result = statusService.manageStatus(submitted.id, "Cancelled");

      assert.equal(result.success, true);
      assert.equal(result.serviceRequest.status, "Cancelled");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Pending cannot move directly to Completed",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      const result = statusService.manageStatus(submitted.id, "Completed");

      assert.equal(result.success, false);
      assert.equal(result.invalidTransition, true);

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "In Progress cannot return to Pending",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "In Progress");
      const result = statusService.manageStatus(submitted.id, "Pending");

      assert.equal(result.success, false);
      assert.equal(result.invalidTransition, true);

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "In Progress");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Completed is a terminal state",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "In Progress");
      statusService.manageStatus(submitted.id, "Completed");

      const toPending = statusService.manageStatus(submitted.id, "Pending");
      assert.equal(toPending.success, false);
      assert.equal(toPending.invalidTransition, true);

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Completed");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Cancelled is a terminal state",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "Cancelled");

      const toInProgress = statusService.manageStatus(submitted.id, "In Progress");
      assert.equal(toInProgress.success, false);
      assert.equal(toInProgress.invalidTransition, true);

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Cancelled");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "unsupported status is rejected",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      const result = statusService.manageStatus(submitted.id, "Approved");

      assert.equal(result.success, false);
      assert.equal(result.unsupportedStatus, true);

      const stored = statusService.serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "nonexistent Service Request is handled safely",
  () => {
    const { databasePath, db, statusService } =
      createStatusSetup();

    try {
      const result = statusService.manageStatus(999999, "In Progress");

      assert.equal(result.success, false);
      assert.equal(result.notFound, true);
      assert.equal(result.serviceRequest, null);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "successful transition preserves Service Request information",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService, serviceRequestRepository } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);
      const originalId = submitted.id;
      const originalResidentId = submitted.residentId;
      const originalServiceType = submitted.serviceType;
      const originalDescription = submitted.description;
      const originalDateRequested = submitted.dateRequested;

      statusService.manageStatus(submitted.id, "In Progress");

      const stored = serviceRequestRepository.findById(originalId);

      assert.equal(stored.id, originalId);
      assert.equal(stored.residentId, originalResidentId);
      assert.equal(stored.serviceType, originalServiceType);
      assert.equal(stored.description, originalDescription);
      assert.equal(stored.dateRequested, originalDateRequested);
      assert.equal(stored.status, "In Progress");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "invalid transition does not modify persistence",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService, serviceRequestRepository } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      statusService.manageStatus(submitted.id, "Completed");

      const stored = serviceRequestRepository.findById(submitted.id);

      assert.equal(stored.status, "Pending");
      assert.equal(stored.id, submitted.id);
      assert.equal(stored.serviceType, submitted.serviceType);
      assert.equal(stored.description, submitted.description);
      assert.equal(stored.dateRequested, submitted.dateRequested);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "same-status request is rejected",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService, serviceRequestRepository } =
      createStatusSetup();

    try {
      const submitted = submitValidRequest(residentRepository, submissionService);

      const result = statusService.manageStatus(submitted.id, "Pending");

      assert.equal(result.success, false);
      assert.equal(result.invalidTransition, true);

      const stored = serviceRequestRepository.findById(submitted.id);
      assert.equal(stored.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "managing one Service Request does not affect another",
  () => {
    const { databasePath, db, residentRepository, submissionService, statusService, serviceRequestRepository } =
      createStatusSetup();

    try {
      const request1 = submitValidRequest(residentRepository, submissionService);

      const resident2 = makeActiveResident({
        contactNumber: "09181234567",
        email: "second@example.com"
      });
      residentRepository.save(resident2);

      const serviceRequest2 = new ServiceRequest({
        residentId: resident2.id,
        serviceType: "Certificate Request",
        description: "Requesting a certificate of residency.",
        dateRequested: "2026-10-03"
      });

      const result2 = submissionService.submitRequest(serviceRequest2);
      const request2 = result2.serviceRequest;

      statusService.manageStatus(request1.id, "In Progress");

      const stored1 = serviceRequestRepository.findById(request1.id);
      const stored2 = serviceRequestRepository.findById(request2.id);

      assert.equal(stored1.status, "In Progress");
      assert.equal(stored2.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);
