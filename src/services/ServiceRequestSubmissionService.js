export class ServiceRequestSubmissionService {
  constructor(validator, residentRepository, serviceRequestRepository) {
    this.validator = validator;
    this.residentRepository = residentRepository;
    this.serviceRequestRepository = serviceRequestRepository;
  }

  submitRequest(serviceRequest) {
    const errors = this.validator.validate(serviceRequest);

    if (errors.length > 0) {
      return {
        success: false,
        serviceRequest: null,
        errors,
        residentNotFound: false,
        residentInactive: false
      };
    }

    const resident =
      this.residentRepository.findById(serviceRequest.residentId);

    if (!resident) {
      return {
        success: false,
        serviceRequest: null,
        errors: [],
        residentNotFound: true,
        residentInactive: false
      };
    }

    if (resident.status === "Inactive") {
      return {
        success: false,
        serviceRequest: null,
        errors: [],
        residentNotFound: false,
        residentInactive: true
      };
    }

    const persisted =
      this.serviceRequestRepository.save(serviceRequest);

    return {
      success: true,
      serviceRequest: persisted,
      errors: [],
      residentNotFound: false,
      residentInactive: false
    };
  }
}
