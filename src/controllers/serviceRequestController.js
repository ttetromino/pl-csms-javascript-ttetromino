import { createDatabase } from "../database/db.js";
import { ResidentRepository } from "../repositories/ResidentRepository.js";
import { ServiceRequestRepository } from "../repositories/ServiceRequestRepository.js";
import { ServiceRequestValidator } from "../services/ServiceRequestValidator.js";
import { ServiceRequestSubmissionService } from "../services/ServiceRequestSubmissionService.js";
import { ServiceRequestStatusService } from "../services/ServiceRequestStatusService.js";
import { ServiceRequestQueryService } from "../services/ServiceRequestQueryService.js";
import { ServiceRequest } from "../models/ServiceRequest.js";

let db = createDatabase();
let residentRepository = new ResidentRepository(db);
let serviceRequestRepository = new ServiceRequestRepository(db);
let serviceRequestValidator = new ServiceRequestValidator();
let submissionService = new ServiceRequestSubmissionService(serviceRequestValidator, residentRepository, serviceRequestRepository);
let statusService = new ServiceRequestStatusService(serviceRequestRepository);
let queryService = new ServiceRequestQueryService(serviceRequestRepository);

export function setServiceRequestDatabase(testDb) {
  db = testDb;
  residentRepository = new ResidentRepository(db);
  serviceRequestRepository = new ServiceRequestRepository(db);
  serviceRequestValidator = new ServiceRequestValidator();
  submissionService = new ServiceRequestSubmissionService(serviceRequestValidator, residentRepository, serviceRequestRepository);
  statusService = new ServiceRequestStatusService(serviceRequestRepository);
  queryService = new ServiceRequestQueryService(serviceRequestRepository);
}

export function listServiceRequests(req, res) {
  try {
    const searchTerm = req.query.search || "";
    const statusFilter = req.query.status || "";
    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    let serviceRequests;
    try {
      serviceRequests = queryService.searchServiceRequests(
        searchTerm || null,
        statusFilter || null
      );
    } catch (err) {
      serviceRequests = queryService.listServiceRequests();
    }

    res.render("service-requests/index", {
      serviceRequests,
      searchTerm,
      statusFilter,
      successMessage,
      errorMessage
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error loading service requests",
      error
    });
  }
}

export function showSubmitForm(req, res) {
  res.render("service-requests/submit", {
    errors: null,
    eligibilityError: null,
    formData: {}
  });
}

export function submitServiceRequest(req, res) {
  try {
    const { residentId, serviceType, description, dateRequested } = req.body;

    const parsedResidentId = parseInt(residentId, 10);

    const serviceRequest = new ServiceRequest({
      id: null,
      residentId: isNaN(parsedResidentId) ? residentId : parsedResidentId,
      serviceType,
      description,
      dateRequested,
      status: "Pending"
    });

    const result = submissionService.submitRequest(serviceRequest);

    if (result.success) {
      return res.redirect(
        `/service-requests?success=${encodeURIComponent("Service Request submitted successfully")}`
      );
    }

    let eligibilityError = null;
    if (result.residentNotFound) {
      eligibilityError = "Resident not found.";
    } else if (result.residentInactive) {
      eligibilityError = "Inactive Residents cannot submit new Service Requests.";
    }

    return res.render("service-requests/submit", {
      errors: result.errors.length > 0 ? result.errors : null,
      eligibilityError,
      formData: req.body
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error submitting service request",
      error
    });
  }
}

export function viewServiceRequest(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(404).render("error", {
        message: "Service Request not found",
        error: { message: "Invalid service request ID" }
      });
    }

    let serviceRequest;
    try {
      serviceRequest = queryService.viewServiceRequest(id);
    } catch (err) {
      return res.status(404).render("error", {
        message: "Service Request not found",
        error: { message: err.message }
      });
    }

    const successMessage = req.query.success || null;
    const errorMessage = req.query.error || null;

    res.render("service-requests/show", {
      serviceRequest,
      successMessage,
      errorMessage
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error loading service request",
      error
    });
  }
}

export function updateServiceRequestStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { requestedStatus } = req.body;

    if (isNaN(id) || id <= 0) {
      return res.status(404).render("error", {
        message: "Service Request not found",
        error: { message: "Invalid service request ID" }
      });
    }

    const result = statusService.manageStatus(id, requestedStatus);

    if (result.notFound) {
      return res.status(404).render("error", {
        message: "Service Request not found",
        error: { message: `No service request found with ID ${id}` }
      });
    }

    if (result.success) {
      const statusMessages = {
        "In Progress": "Service Request is now In Progress.",
        "Completed": "Service Request completed successfully.",
        "Cancelled": "Service Request cancelled successfully."
      };
      const message = statusMessages[requestedStatus] || "Service Request updated.";
      return res.redirect(
        `/service-requests/${id}?success=${encodeURIComponent(message)}`
      );
    }

    const errorMsg = result.invalidTransition
      ? "Invalid status transition."
      : "Unsupported status.";

    return res.redirect(
      `/service-requests/${id}?error=${encodeURIComponent(errorMsg)}`
    );
  } catch (error) {
    res.status(500).render("error", {
      message: "Error updating service request status",
      error
    });
  }
}
