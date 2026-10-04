import test from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ResidentDeactivationService } from "../src/services/ResidentDeactivationService.js";
import { ResidentQueryService } from "../src/services/ResidentQueryService.js";
import { createDatabase } from "../src/database/db.js";

function createTemporaryDatabasePath() {
  const fileName =
    `csms-t07-${crypto.randomUUID()}.sqlite`;

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

function createDeactivationSetup() {
  const databasePath =
    createTemporaryDatabasePath();

  const db = createDatabase(databasePath);

  const repository =
    new ResidentRepository(db);

  const service =
    new ResidentDeactivationService(
      repository
    );

  const queryService =
    new ResidentQueryService(repository);

  return {
    databasePath,
    db,
    repository,
    service,
    queryService
  };
}

function cleanupDeactivationSetup(databasePath, db) {
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

test(
  "Active Resident can be deactivated",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      const result =
        service.deactivateResident(resident.id);

      assert.equal(result.success, true);
      assert.ok(result.resident);
      assert.equal(result.notFound, false);
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "Resident status becomes Inactive in persistence",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      service.deactivateResident(resident.id);

      const stored =
        repository.findById(resident.id);

      assert.ok(stored);
      assert.equal(stored.status, "Inactive");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "Resident ID is preserved after deactivation",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);
      const originalId = resident.id;

      const result =
        service.deactivateResident(resident.id);

      assert.equal(result.success, true);
      assert.equal(result.resident.id, originalId);
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "Resident information is preserved after deactivation",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      service.deactivateResident(resident.id);

      const stored =
        repository.findById(resident.id);

      assert.ok(stored);
      assert.equal(stored.firstName, "Juan");
      assert.equal(stored.lastName, "Dela Cruz");
      assert.equal(stored.address, "Barangay Santo Tomas");
      assert.equal(stored.contactNumber, "09171234567");
      assert.equal(stored.email, "juan@example.com");
      assert.equal(stored.status, "Inactive");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "deactivated Resident remains persisted and retrievable",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      service.deactivateResident(resident.id);

      const stored =
        repository.findById(resident.id);

      assert.ok(stored);
      assert.equal(stored.id, resident.id);
      assert.equal(stored.status, "Inactive");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "deactivated Resident remains available through T05",
  () => {
    const {
      databasePath,
      db,
      repository,
      service,
      queryService
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      service.deactivateResident(resident.id);

      const searchResults =
        queryService.searchResidents("Juan");

      const found = searchResults.find(
        (r) => r.id === resident.id
      );

      assert.ok(found);
      assert.equal(found.status, "Inactive");

      const allResidents =
        queryService.listResidents();

      const listedFound = allResidents.find(
        (r) => r.id === resident.id
      );

      assert.ok(listedFound);
      assert.equal(listedFound.status, "Inactive");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "already-Inactive Resident is handled safely",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident({
        status: "Inactive"
      });
      repository.save(resident);

      const result =
        service.deactivateResident(resident.id);

      assert.equal(result.success, true);
      assert.ok(result.resident);
      assert.equal(result.alreadyInactive, true);
      assert.equal(result.notFound, false);
      assert.equal(result.resident.id, resident.id);
      assert.equal(result.resident.status, "Inactive");
      assert.equal(result.resident.firstName, "Juan");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "nonexistent Resident is handled safely",
  () => {
    const {
      databasePath,
      db,
      service
    } = createDeactivationSetup();

    try {
      const result =
        service.deactivateResident(999999);

      assert.equal(result.success, false);
      assert.equal(result.resident, null);
      assert.equal(result.notFound, true);
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "nonexistent deactivation does not create or delete records",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident = makeActiveResident();
      repository.save(resident);

      const before = repository.findAll();

      service.deactivateResident(999999);

      const after = repository.findAll();

      assert.equal(after.length, before.length);
      assert.equal(after[0].status, "Active");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);

test(
  "deactivating one Resident does not affect another",
  () => {
    const {
      databasePath,
      db,
      repository,
      service
    } = createDeactivationSetup();

    try {
      const resident1 = makeActiveResident({
        contactNumber: "09171234561",
        email: "resident1@example.com"
      });
      repository.save(resident1);

      const resident2 = makeActiveResident({
        firstName: "Maria",
        lastName: "Santos",
        contactNumber: "09171234562",
        email: "resident2@example.com"
      });
      repository.save(resident2);

      service.deactivateResident(resident1.id);

      const stored1 = repository.findById(resident1.id);
      const stored2 = repository.findById(resident2.id);

      assert.equal(stored1.status, "Inactive");
      assert.equal(stored2.status, "Active");
      assert.equal(stored2.firstName, "Maria");
      assert.equal(stored2.lastName, "Santos");
    } finally {
      cleanupDeactivationSetup(databasePath, db);
    }
  }
);
