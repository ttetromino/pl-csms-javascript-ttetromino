export class ServiceRequestValidator {
  validate(serviceRequest) {
    const errors = [];

    if (serviceRequest.id !== null) {
      errors.push("id");
    }

    if (!this.isValidResidentId(serviceRequest.residentId)) {
      errors.push("residentId");
    }

    if (this.isBlank(serviceRequest.serviceType)) {
      errors.push("serviceType");
    }

    if (this.isBlank(serviceRequest.description)) {
      errors.push("description");
    }

    if (!this.isValidDate(serviceRequest.dateRequested)) {
      errors.push("dateRequested");
    }

    if (serviceRequest.status !== "Pending") {
      errors.push("status");
    }

    return errors;
  }

  isBlank(value) {
    return (
      typeof value !== "string" ||
      value.trim().length === 0
    );
  }

  isValidResidentId(value) {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === "number" &&
      Number.isInteger(value) &&
      value > 0
    );
  }

  isValidDate(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return false;
    }

    const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_PATTERN.test(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}
