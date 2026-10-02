import test from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { Resident } from "../src/models/Resident.js";
import { ResidentValidator } from "../src/services/ResidentValidator.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ResidentUpdateService } from "../src/services/ResidentUpdateService.js";
import { ResidentQueryService } from "../src/services/ResidentQueryService.js";
import { createDatabase } from "../src/database/db.js";

function createTemporaryDatabasePath() {
  const fileName =
    `csms-t06-${crypto.randomUUID()}.sqlite`;

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

function createUpdateSetup() {
  const databasePath =
    createTemporaryDatabasePath();

  const db = createDatabase(databasePath);

  const repository =
    new ResidentRepository(db);

  const validator =
    new ResidentValidator();

  const service =
    new ResidentUpdateService(
      validator,
      repository
    );

  const queryService =
    new ResidentQueryService(repository);

  return {
    databasePath,
    db,
    repository,
    validator,
    service,
    queryService
  };
}

function cleanupUpdateSetup(databasePath, db) {
  if (db && typeof db.close === "function") {
    db.close();
  }

  removeDatabase(databasePath);
}

function makeValidResident(overrides = {}) {
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

function makeValidProposedInfo(overrides = {}) {
  return {
    firstName: "Miguel",
    lastName: "Santos",
    address: "Barangay San Isidro",
    contactNumber: "09181234567",
    email: "miguel@example.com",
    ...overrides
  };
}

test(
  "valid Resident update succeeds",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);

      const result = service.updateResident(
        resident.id,
        makeValidProposedInfo()
      );

      assert.equal(result.success, true);
      assert.ok(result.resident);
      assert.deepEqual(result.errors, []);
      assert.equal(result.notFound, false);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "Resident ID is preserved after update",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);
      const originalId = resident.id;

      const result = service.updateResident(
        resident.id,
        makeValidProposedInfo()
      );

      assert.equal(result.success, true);
      assert.equal(result.resident.id, originalId);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "permitted Resident information is persisted",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);

      const proposed = makeValidProposedInfo();

      service.updateResident(resident.id, proposed);

      const stored = repository.findById(resident.id);

      assert.ok(stored);
      assert.equal(stored.firstName, proposed.firstName);
      assert.equal(stored.lastName, proposed.lastName);
      assert.equal(stored.address, proposed.address);
      assert.equal(stored.contactNumber, proposed.contactNumber);
      assert.equal(stored.email, proposed.email);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "Resident status is preserved after update",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const activeResident = makeValidResident({ status: "Active" });
      repository.save(activeResident);

      service.updateResident(
        activeResident.id,
        makeValidProposedInfo()
      );

      const storedActive = repository.findById(activeResident.id);
      assert.equal(storedActive.status, "Active");

      const inactiveResident = makeValidResident({
        contactNumber: "09181234567",
        email: "inactive@example.com",
        status: "Inactive"
      });
      repository.save(inactiveResident);

      service.updateResident(
        inactiveResident.id,
        makeValidProposedInfo({
          contactNumber: "09191234567",
          email: "updated.inactive@example.com"
        })
      );

      const storedInactive = repository.findById(inactiveResident.id);
      assert.equal(storedInactive.status, "Inactive");
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "invalid update fails",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);

      const result = service.updateResident(
        resident.id,
        makeValidProposedInfo({ firstName: "" })
      );

      assert.equal(result.success, false);
      assert.equal(result.resident, null);
      assert.ok(result.errors.length > 0);
      assert.equal(result.notFound, false);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "invalid update does not modify persisted information",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);

      service.updateResident(
        resident.id,
        makeValidProposedInfo({ firstName: "", contactNumber: "INVALID" })
      );

      const stored = repository.findById(resident.id);

      assert.equal(stored.firstName, "Juan");
      assert.equal(stored.lastName, "Dela Cruz");
      assert.equal(stored.contactNumber, "09171234567");
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "updating a nonexistent Resident is handled safely",
  () => {
    const {
      databasePath,
      db,
      service
    } = createUpdateSetup();

    try {
      const result = service.updateResident(
        999999,
        makeValidProposedInfo()
      );

      assert.equal(result.success, false);
      assert.equal(result.resident, null);
      assert.equal(result.notFound, true);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "nonexistent update does not create a Resident",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const before = repository.findAll();

      service.updateResident(
        999999,
        makeValidProposedInfo()
      );

      const after = repository.findAll();

      assert.equal(after.length, before.length);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "updated Resident is visible through T05 querying",
  () => {
    const {
      databasePath,
      db,
      repository,
      service,
      queryService
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);

      service.updateResident(
        resident.id,
        makeValidProposedInfo({
          firstName: "Miguel",
          lastName: "Santos"
        })
      );

      const results = queryService.searchResidents("Miguel");

      assert.equal(results.length, 1);
      assert.equal(results[0].firstName, "Miguel");
      assert.equal(results[0].lastName, "Santos");
      assert.equal(results[0].id, resident.id);
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);

test(
  "updated information and contact number are preserved",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident = makeValidResident();
      repository.save(resident);
      const originalId = resident.id;

      const proposed = makeValidProposedInfo({
        contactNumber: "09181234567"
      });

      service.updateResident(resident.id, proposed);

      const stored = repository.findById(originalId);

      assert.ok(stored);
      assert.equal(stored.id, originalId);
      assert.equal(stored.firstName, proposed.firstName);
      assert.equal(stored.lastName, proposed.lastName);
      assert.equal(stored.address, proposed.address);
      assert.equal(stored.contactNumber, "09181234567");
      assert.equal(stored.email, proposed.email);
      assert.equal(stored.status, "Active");
    } finally {
      cleanupUpdateSetup(databasePath, db);
    }
  }
);
