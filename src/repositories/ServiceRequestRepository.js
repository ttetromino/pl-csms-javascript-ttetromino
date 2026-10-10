import { ServiceRequest } from "../models/ServiceRequest.js";

export class ServiceRequestRepository {
  constructor(db) {
    this.db = db;
  }

  save(serviceRequest) {
    const stmt = this.db.prepare(`
      INSERT INTO service_requests (resident_id, service_type, description, date_requested, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      serviceRequest.residentId,
      serviceRequest.serviceType,
      serviceRequest.description,
      serviceRequest.dateRequested,
      serviceRequest.status
    );

    serviceRequest.id = Number(result.lastInsertRowid);
    return serviceRequest;
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT id, resident_id, service_type, description, date_requested, status
      FROM service_requests
      WHERE id = ?
    `);

    const row = stmt.get(id);
    if (!row) {
      return null;
    }

    return this.mapRowToServiceRequest(row);
  }

  updateStatus(id, status) {
    const stmt = this.db.prepare(`
      UPDATE service_requests
      SET status = ?
      WHERE id = ?
    `);

    stmt.run(status, id);

    return this.findById(id);
  }

  mapRowToServiceRequest(row) {
    return new ServiceRequest({
      id: row.id,
      residentId: row.resident_id,
      serviceType: row.service_type,
      description: row.description,
      dateRequested: row.date_requested,
      status: row.status
    });
  }
}
