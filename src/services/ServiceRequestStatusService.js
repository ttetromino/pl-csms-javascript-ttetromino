const SUPPORTED_STATUSES = new Set([
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled"
]);

const ALLOWED_TRANSITIONS = new Map([
  ["Pending",     new Set(["In Progress", "Cancelled"])],
  ["In Progress", new Set(["Completed",   "Cancelled"])],
  ["Completed",   new Set()],
  ["Cancelled",   new Set()]
]);

export class ServiceRequestStatusService {
  constructor(serviceRequestRepository) {
    this.serviceRequestRepository = serviceRequestRepository;
  }

  manageStatus(serviceRequestId, requestedStatus) {
    const existing =
      this.serviceRequestRepository.findById(serviceRequestId);

    if (!existing) {
      return {
        success: false,
        serviceRequest: null,
        notFound: true,
        unsupportedStatus: false,
        invalidTransition: false
      };
    }

    if (!SUPPORTED_STATUSES.has(requestedStatus)) {
      return {
        success: false,
        serviceRequest: null,
        notFound: false,
        unsupportedStatus: true,
        invalidTransition: false
      };
    }

    const allowedNext = ALLOWED_TRANSITIONS.get(existing.status);

    if (!allowedNext || !allowedNext.has(requestedStatus)) {
      return {
        success: false,
        serviceRequest: null,
        notFound: false,
        unsupportedStatus: false,
        invalidTransition: true
      };
    }

    const updated =
      this.serviceRequestRepository.updateStatus(
        serviceRequestId,
        requestedStatus
      );

    return {
      success: true,
      serviceRequest: updated,
      notFound: false,
      unsupportedStatus: false,
      invalidTransition: false
    };
  }
}
