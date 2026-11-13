import { Router } from "express";

import { showHealth } from "../controllers/healthController.js";
import { showHome } from "../controllers/homeController.js";
import {
  listResidents,
  showRegisterForm,
  registerResident,
  showEditForm,
  updateResident,
  deactivateResident
} from "../controllers/residentController.js";
import {
  listServiceRequests,
  showSubmitForm,
  submitServiceRequest,
  viewServiceRequest,
  updateServiceRequestStatus
} from "../controllers/serviceRequestController.js";
import { showDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.get("/", showHome);
router.get("/health", showHealth);
router.get("/dashboard", showDashboard);

router.get("/residents", listResidents);
router.get("/residents/register", showRegisterForm);
router.post("/residents/register", registerResident);
router.get("/residents/:id/edit", showEditForm);
router.post("/residents/:id/edit", updateResident);
router.post("/residents/:id/deactivate", deactivateResident);

router.get("/service-requests", listServiceRequests);
router.get("/service-requests/new", showSubmitForm);
router.post("/service-requests/new", submitServiceRequest);
router.get("/service-requests/:id", viewServiceRequest);
router.post("/service-requests/:id/status", updateServiceRequestStatus);

export default router;