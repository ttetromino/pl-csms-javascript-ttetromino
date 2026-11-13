export class ServiceRequestQueryService {
  constructor(serviceRequestRepository) {
    this.serviceRequestRepository = serviceRequestRepository;
  }

  listServiceRequests() {
    return this.serviceRequestRepository.findAll();
  }

  viewServiceRequest(id) {
    if (!id || typeof id !== "number" || id <= 0) {
      throw new Error("Invalid service request ID");
    }

    const serviceRequest = this.serviceRequestRepository.findById(id);
    if (!serviceRequest) {
      throw new Error("Service request not found");
    }

    return serviceRequest;
  }

  searchServiceRequests(searchTerm, statusFilter) {
    const normalizedSearchTerm = searchTerm ? searchTerm.trim() : "";
    const normalizedStatusFilter = statusFilter ? statusFilter.trim() : "";

    if (normalizedStatusFilter) {
      const validStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
      if (!validStatuses.includes(normalizedStatusFilter)) {
        throw new Error("Invalid status filter");
      }
    }

    if (!normalizedSearchTerm && !normalizedStatusFilter) {
      return this.serviceRequestRepository.findAll();
    }

    const finalSearchTerm = normalizedSearchTerm || null;
    const finalStatusFilter = normalizedStatusFilter || null;

    return this.serviceRequestRepository.searchAndFilter(finalSearchTerm, finalStatusFilter);
  }
}
