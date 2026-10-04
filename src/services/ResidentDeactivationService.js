export class ResidentDeactivationService {
  constructor(repository) {
    this.repository = repository;
  }

  deactivateResident(residentId) {
    const existing =
      this.repository.findById(residentId);

    if (!existing) {
      return {
        success: false,
        resident: null,
        notFound: true,
        alreadyInactive: false
      };
    }

    if (existing.status === "Inactive") {
      return {
        success: true,
        resident: existing,
        notFound: false,
        alreadyInactive: true
      };
    }

    const deactivated =
      this.repository.deactivateById(residentId);

    return {
      success: true,
      resident: deactivated,
      notFound: false,
      alreadyInactive: false
    };
  }
}
