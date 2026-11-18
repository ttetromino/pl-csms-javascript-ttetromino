import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { applicationConfig } from "./config/application.js";
import { notFound } from "./middleware/notFound.js";
import mainRoutes from "./routes/index.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

/**
 * Create and configure the CSMS Express application.
 *
 * @returns {import("express").Express} Configured Express application.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.set("views", path.join(currentDirectory, "views"));
  app.set("view engine", "ejs");

  // Make release version available to all EJS templates from single source of truth
  app.locals.applicationVersion = applicationConfig.version;
  app.locals.applicationShortName = applicationConfig.shortName;

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(currentDirectory, "..", "public")));

  app.use(mainRoutes);

  app.use(notFound);

  return app;
}