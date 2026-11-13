import { createDatabase } from "../database/db.js";
import { ResidentRepository } from "../repositories/ResidentRepository.js";
import { ResidentValidator } from "../services/ResidentValidator.js";
import { ResidentRegistrationService } from "../services/ResidentRegistrationService.js";
import { ResidentQueryService } from "../services/ResidentQueryService.js";
import { ResidentUpdateService } from "../services/ResidentUpdateService.js";
import { ResidentDeactivationService } from "../services/ResidentDeactivationService.js";
import { Resident } from "../models/Resident.js";

// Default production database
let db = createDatabase();
let residentRepository = new ResidentRepository(db);
let residentValidator = new ResidentValidator();
let registrationService = new ResidentRegistrationService(residentValidator, residentRepository);
let queryService = new ResidentQueryService(residentRepository);
let updateService = new ResidentUpdateService(residentValidator, residentRepository);
let deactivationService = new ResidentDeactivationService(residentRepository);

// Allow dependency injection for testing
export function setDatabase(testDb) {
  db = testDb;
  residentRepository = new ResidentRepository(db);
  residentValidator = new ResidentValidator();
  registrationService = new ResidentRegistrationService(residentValidator, residentRepository);
  queryService = new ResidentQueryService(residentRepository);
  updateService = new ResidentUpdateService(residentValidator, residentRepository);
  deactivationService = new ResidentDeactivationService(residentRepository);
}

export function listResidents(req, res) {
  try {
    const searchTerm = req.query.search || "";
    
    let residents;
    if (searchTerm.trim()) {
      residents = queryService.searchResidents(searchTerm);
    } else {
      residents = queryService.listResidents();
    }

    const successMessage = req.query.success;
    
    res.render("residents/index", {
      residents,
      searchTerm,
      successMessage
    });
  } catch (error) {
    res.status(500).render("error", { 
      message: "Error loading residents",
      error
    });
  }
}

export function showRegisterForm(req, res) {
  res.render("residents/register", {
    errors: null,
    formData: {}
  });
}

export function registerResident(req, res) {
  try {
    const { firstName, lastName, address, contactNumber, email } = req.body;

    const resident = new Resident({
      firstName,
      lastName,
      address,
      contactNumber,
      email,
      status: "Active"
    });

    const result = registrationService.registerResident(resident);

    if (result.success) {
      return res.redirect("/residents?success=Resident registered successfully");
    } else {
      return res.render("residents/register", {
        errors: result.errors,
        formData: req.body
      });
    }
  } catch (error) {
    res.status(500).render("error", {
      message: "Error registering resident",
      error
    });
  }
}

export function showEditForm(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: "Invalid resident ID" }
      });
    }

    const resident = residentRepository.findById(id);

    if (!resident) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: `No resident found with ID ${id}` }
      });
    }

    res.render("residents/edit", {
      resident,
      errors: null
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "Error loading resident",
      error
    });
  }
}

export function updateResident(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: "Invalid resident ID" }
      });
    }

    const { firstName, lastName, address, contactNumber, email } = req.body;

    const proposedInfo = {
      firstName,
      lastName,
      address,
      contactNumber,
      email
    };

    const result = updateService.updateResident(id, proposedInfo);

    if (result.notFound) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: `No resident found with ID ${id}` }
      });
    }

    if (result.success) {
      return res.redirect("/residents?success=Resident information updated successfully");
    } else {
      const existingResident = residentRepository.findById(id);
      const updatedResident = new Resident({
        id: existingResident.id,
        firstName,
        lastName,
        address,
        contactNumber,
        email,
        status: existingResident.status
      });

      return res.render("residents/edit", {
        resident: updatedResident,
        errors: result.errors
      });
    }
  } catch (error) {
    res.status(500).render("error", {
      message: "Error updating resident",
      error
    });
  }
}

export function deactivateResident(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: "Invalid resident ID" }
      });
    }

    const result = deactivationService.deactivateResident(id);

    if (result.notFound) {
      return res.status(404).render("error", {
        message: "Resident not found",
        error: { message: `No resident found with ID ${id}` }
      });
    }

    if (result.success) {
      const message = result.alreadyInactive 
        ? "Resident status unchanged" 
        : "Resident deactivated successfully";
      return res.redirect(`/residents?success=${encodeURIComponent(message)}`);
    }

    return res.redirect("/residents?success=Resident status unchanged");
  } catch (error) {
    res.status(500).render("error", {
      message: "Error deactivating resident",
      error
    });
  }
}
