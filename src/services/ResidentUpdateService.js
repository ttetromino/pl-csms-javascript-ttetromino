import { Resident } from "../models/Resident.js";

export class ResidentUpdateService {
  constructor(validator, repository) {
    this.validator = validator;
    this.repository = repository;
  }

  updateResident(residentId, proposedInfo) {
    const existing =
      this.repository.findById(residentId);

    if (!existing) {
      return {
        success: false,
        resident: null,
        errors: [],
        notFound: true
      };
    }

    const candidate = new Resident({
      id: existing.id,
      firstName: proposedInfo.firstName,
      lastName: proposedInfo.lastName,
      address: proposedInfo.address,
      contactNumber: proposedInfo.contactNumber,
      email: proposedInfo.email,
      status: existing.status
    });

    const errors = this.validator.validate(candidate);

    if (errors.length > 0) {
      return {
        success: false,
        resident: null,
        errors,
        notFound: false
      };
    }

    const updatedResident =
      this.repository.update(candidate);

    return {
      success: true,
      resident: updatedResident,
      errors: [],
      notFound: false
    };
  }
}
