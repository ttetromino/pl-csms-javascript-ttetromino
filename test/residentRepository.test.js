import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createDatabase } from "../src/database/db.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { Resident } from "../src/models/Resident.js";

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

describe("ResidentRepository Persistence Tests", () => {
  let tempDbPath;
  let db;
  let repository;

  beforeEach(() => {
    tempDbPath = path.join(os.tmpdir(), `test-csms-${Date.now()}-${Math.random()}.db`);
    db = createDatabase(tempDbPath);
    repository = new ResidentRepository(db);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  // Test 1
  test("persists a resident successfully", () => {
    const resident = makeValidResident();
    const saved = repository.save(resident);
    assert.ok(saved);
  });

  // Test 2
  test("resident receives an auto-generated identifier from SQLite", () => {
    const resident = makeValidResident();
    assert.equal(resident.id, null);

    repository.save(resident);
    assert.notEqual(resident.id, null);
    assert.equal(typeof resident.id, "number");
  });

  // Test 3
  test("retrieves a resident by identifier", () => {
    const resident = makeValidResident();
    repository.save(resident);

    const retrieved = repository.findById(resident.id);
    assert.notEqual(retrieved, null);
    assert.equal(retrieved.id, resident.id);
  });

  // Test 4
  test("preserves all resident field information and leading zero in contact number", () => {
    const resident = makeValidResident({ contactNumber: "09981234567" });
    repository.save(resident);

    const retrieved = repository.findById(resident.id);
    assert.equal(retrieved.firstName, "Juan");
    assert.equal(retrieved.lastName, "Dela Cruz");
    assert.equal(retrieved.address, "Barangay Santo Tomas");
    assert.equal(retrieved.contactNumber, "09981234567");
    assert.equal(retrieved.email, "juan@example.com");
  });

  // Test 5
  test("preserves Active status on retrieval", () => {
    const resident = makeValidResident({ status: "Active" });
    repository.save(resident);

    const retrieved = repository.findById(resident.id);
    assert.equal(retrieved.status, "Active");
  });

  // Test 6
  test("returns null when searching for a non-existent identifier", () => {
    const retrieved = repository.findById(999999);
    assert.equal(retrieved, null);
  });

  // Test 7
  test("verifies real persistence across separate repository instances", () => {
    const resident = makeValidResident({ firstName: "Maria" });
    repository.save(resident);
    const assignedId = resident.id;
    const secondRepo = new ResidentRepository(db);
    const retrieved = secondRepo.findById(assignedId);

    assert.notEqual(retrieved, null);
    assert.equal(retrieved.firstName, "Maria");
  });

  // Test 8
  test("assigns unique incrementing IDs to multiple residents", () => {
    const res1 = repository.save(makeValidResident({ firstName: "Alice" }));
    const res2 = repository.save(makeValidResident({ firstName: "Bob" }));

    assert.notEqual(res1.id, res2.id);
    assert.equal(res2.id, res1.id + 1);

    const retrieved1 = repository.findById(res1.id);
    const retrieved2 = repository.findById(res2.id);

    assert.equal(retrieved1.firstName, "Alice");
    assert.equal(retrieved2.firstName, "Bob");
  });
});