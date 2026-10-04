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
import { createDatabase } from "../src/database/db.js";

function createTemporaryDatabasePath() {
  const fileName =
    `csms-t09-${crypto.randomUUID()}.sqlite`;

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

function createSubmissionSetup() {
  const databasePath =
    createTemporaryDatabasePath();

  const db = createDatabase(databasePath);

  const residentRepository =
    new ResidentRepository(db);

  const serviceRequestRepository =
    new ServiceRequestRepository(db);

  const validator =
    new ServiceRequestValidator();

  const service =
    new ServiceRequestSubmissionService(
      validator,
      residentRepository,
      serviceRequestRepository
    );

  return {
    databasePath,
    db,
    residentRepository,
    serviceRequestRepository,
    validator,
    service
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

function makeValidServiceRequest(residentId, overrides = {}) {
  return new ServiceRequest({
    residentId,
    serviceType: "Barangay Clearance",
    description: "Requesting barangay clearance for employment requirements.",
    dateRequested: "2026-10-02",
    ...overrides
  });
}

test(
  "valid Service Request submission succeeds",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      assert.equal(result.success, true);
      assert.ok(result.serviceRequest);
      assert.deepEqual(result.errors, []);
      assert.equal(result.residentNotFound, false);
      assert.equal(result.residentInactive, false);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "submitted Service Request receives a generated ID",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);

      assert.equal(request.id, null);

      const result = service.submitRequest(request);

      assert.equal(result.success, true);
      assert.notEqual(result.serviceRequest.id, null);
      assert.notEqual(result.serviceRequest.id, undefined);
      assert.equal(typeof result.serviceRequest.id, "number");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "submitted Service Request is persisted and retrievable",
  () => {
    const {
      databasePath,
      db,
      residentRepository,
      serviceRequestRepository,
      service
    } = createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      assert.equal(result.success, true);

      const stored = serviceRequestRepository.findById(
        result.serviceRequest.id
      );

      assert.ok(stored);
      assert.equal(stored.id, result.serviceRequest.id);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "submitted Service Request information is preserved",
  () => {
    const {
      databasePath,
      db,
      residentRepository,
      serviceRequestRepository,
      service
    } = createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      const stored = serviceRequestRepository.findById(
        result.serviceRequest.id
      );

      assert.ok(stored);
      assert.equal(stored.residentId, resident.id);
      assert.equal(stored.serviceType, "Barangay Clearance");
      assert.equal(
        stored.description,
        "Requesting barangay clearance for employment requirements."
      );
      assert.equal(stored.dateRequested, "2026-10-02");
      assert.equal(stored.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "submitted Service Request status is Pending",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      assert.equal(result.success, true);
      assert.equal(result.serviceRequest.status, "Pending");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "blank service type fails validation",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id, {
        serviceType: "   "
      });

      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.equal(result.serviceRequest, null);
      assert.ok(result.errors.includes("serviceType"));
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "blank description fails validation",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id, {
        description: ""
      });

      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.equal(result.serviceRequest, null);
      assert.ok(result.errors.includes("description"));
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "invalid request does not reach persistence",
  () => {
    const {
      databasePath,
      db,
      residentRepository,
      serviceRequestRepository,
      service
    } = createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const before = serviceRequestRepository.findById(1);

      const request = makeValidServiceRequest(resident.id, {
        serviceType: "",
        description: ""
      });

      service.submitRequest(request);

      const result = service.submitRequest(request);

      assert.equal(result.success, false);

      const allCheck = serviceRequestRepository.findById(1);
      assert.equal(allCheck, null);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "nonexistent Resident prevents submission",
  () => {
    const {
      databasePath,
      db,
      serviceRequestRepository,
      service
    } = createSubmissionSetup();

    try {
      const request = makeValidServiceRequest(999999);
      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.equal(result.serviceRequest, null);
      assert.equal(result.residentNotFound, true);

      const stored = serviceRequestRepository.findById(1);
      assert.equal(stored, null);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Inactive Resident cannot submit a new Service Request",
  () => {
    const {
      databasePath,
      db,
      residentRepository,
      serviceRequestRepository,
      service
    } = createSubmissionSetup();

    try {
      const resident = makeActiveResident({ status: "Inactive" });
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.equal(result.serviceRequest, null);
      assert.equal(result.residentInactive, true);

      const stored = serviceRequestRepository.findById(1);
      assert.equal(stored, null);

      const storedResident = residentRepository.findById(resident.id);
      assert.equal(storedResident.status, "Inactive");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "non-Pending initial status is rejected",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id, {
        status: "Completed"
      });

      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.ok(result.errors.includes("status"));
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "Service Request persists across repository access",
  () => {
    const {
      databasePath,
      db,
      residentRepository,
      service
    } = createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id);
      const result = service.submitRequest(request);

      assert.equal(result.success, true);

      const secondRepository = new ServiceRequestRepository(db);

      const stored = secondRepository.findById(result.serviceRequest.id);

      assert.ok(stored);
      assert.equal(stored.id, result.serviceRequest.id);
      assert.equal(stored.serviceType, result.serviceRequest.serviceType);
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "submission does not modify the Resident",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const originalId = resident.id;

      const request = makeValidServiceRequest(resident.id);
      service.submitRequest(request);

      const storedResident = residentRepository.findById(originalId);

      assert.ok(storedResident);
      assert.equal(storedResident.id, originalId);
      assert.equal(storedResident.firstName, "Juan");
      assert.equal(storedResident.lastName, "Dela Cruz");
      assert.equal(storedResident.address, "Barangay Santo Tomas");
      assert.equal(storedResident.contactNumber, "09171234567");
      assert.equal(storedResident.email, "juan@example.com");
      assert.equal(storedResident.status, "Active");
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);

test(
  "invalid date requested fails validation",
  () => {
    const { databasePath, db, residentRepository, service } =
      createSubmissionSetup();

    try {
      const resident = makeActiveResident();
      residentRepository.save(resident);

      const request = makeValidServiceRequest(resident.id, {
        dateRequested: "not-a-date"
      });

      const result = service.submitRequest(request);

      assert.equal(result.success, false);
      assert.ok(result.errors.includes("dateRequested"));
    } finally {
      cleanupSetup(databasePath, db);
    }
  }
);
