import test from "node:test";
import assert from "node:assert/strict";

import { ServiceRequest } from "../src/models/ServiceRequest.js";

test(
  "Service Request can be created",
  () => {
    const request = new ServiceRequest({
      residentId: 25,
      serviceType: "Barangay Clearance",
      description: "Request for employment requirement",
      dateRequested: "2026-10-02"
    });

    assert.ok(request);
  }
);

test(
  "Service Request information is accessible",
  () => {
    const request = new ServiceRequest({
      residentId: 25,
      serviceType: "Barangay Clearance",
      description: "Request for employment requirement",
      dateRequested: "2026-10-02"
    });

    assert.equal(request.residentId, 25);
    assert.equal(request.serviceType, "Barangay Clearance");
    assert.equal(
      request.description,
      "Request for employment requirement"
    );
    assert.equal(request.dateRequested, "2026-10-02");
  }
);

test(
  "Resident ID is preserved",
  () => {
    const request = new ServiceRequest({
      residentId: 25,
      serviceType: "Certificate Request",
      description: "Requesting a certificate of residency",
      dateRequested: "2026-10-02"
    });

    assert.equal(request.residentId, 25);
  }
);

test(
  "new Service Request has an unassigned ID",
  () => {
    const request = new ServiceRequest({
      residentId: 25,
      serviceType: "Community Assistance",
      description: "Requesting community assistance",
      dateRequested: "2026-10-02"
    });

    assert.equal(request.id, null);
  }
);

test(
  "new Service Request defaults to Pending",
  () => {
    const request = new ServiceRequest({
      residentId: 25,
      serviceType: "Permit Request",
      description: "Requesting a permit",
      dateRequested: "2026-10-02"
    });

    assert.equal(request.status, "Pending");
  }
);

test(
  "Service Request information is independent between objects",
  () => {
    const request1 = new ServiceRequest({
      residentId: 10,
      serviceType: "Barangay Clearance",
      description: "First request description",
      dateRequested: "2026-10-01"
    });

    const request2 = new ServiceRequest({
      residentId: 20,
      serviceType: "Certificate Request",
      description: "Second request description",
      dateRequested: "2026-10-02"
    });

    assert.equal(request1.residentId, 10);
    assert.equal(request2.residentId, 20);

    assert.equal(request1.serviceType, "Barangay Clearance");
    assert.equal(request2.serviceType, "Certificate Request");

    assert.equal(request1.description, "First request description");
    assert.equal(request2.description, "Second request description");

    assert.equal(request1.dateRequested, "2026-10-01");
    assert.equal(request2.dateRequested, "2026-10-02");
  }
);
