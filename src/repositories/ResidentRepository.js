/**
 * Resident persistence placeholder.
 *
 * Persistence behavior will be introduced through a future CSMS ticket.
 */
import { Resident } from "../models/Resident.js";

export class ResidentRepository {
  constructor(db) {
    this.db = db;
  }

  save(resident) {
    const stmt = this.db.prepare(`
      INSERT INTO residents (first_name, last_name, address, contact_number, email, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      resident.firstName,
      resident.lastName,
      resident.address,
      resident.contactNumber,
      resident.email,
      resident.status
    );

    resident.id = Number(result.lastInsertRowid);
    return resident;
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT id, first_name, last_name, address, contact_number, email, status
      FROM residents
      WHERE id = ?
    `);

    const row = stmt.get(id);
    if (!row) {
      return null;
    }

    return this.mapRowToResident(row);
  }

  mapRowToResident(row) {
    return new Resident({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      address: row.address,
      contactNumber: row.contact_number,
      email: row.email,
      status: row.status
    });
  }
}