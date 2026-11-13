import { createDatabase } from "../database/db.js";
import { ResidentRepository } from "../repositories/ResidentRepository.js";
import { ServiceRequestRepository } from "../repositories/ServiceRequestRepository.js";
import { DashboardService } from "../services/DashboardService.js";

// Default production database
let db = createDatabase();
let residentRepository = new ResidentRepository(db);
let serviceRequestRepository = new ServiceRequestRepository(db);
let dashboardService = new DashboardService(residentRepository, serviceRequestRepository);

// Allow dependency injection for testing
export function setDashboardDatabase(testDb) {
  db = testDb;
  residentRepository = new ResidentRepository(db);
  serviceRequestRepository = new ServiceRequestRepository(db);
  dashboardService = new DashboardService(residentRepository, serviceRequestRepository);
}

export function showDashboard(req, res) {
  try {
    const summary = dashboardService.getDashboardSummary();

    res.render("dashboard", {
      residents: summary.residents,
      serviceRequests: summary.serviceRequests,
      recentServiceRequests: summary.recentServiceRequests
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error loading dashboard",
      error
    });
  }
}
