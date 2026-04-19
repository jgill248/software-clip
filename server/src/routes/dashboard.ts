import { Router } from "express";
import type { Db } from "@softclipai/db";
import { dashboardService } from "../services/dashboard.js";
import { assertCompanyAccess } from "./authz.js";

export function dashboardRoutes(db: Db) {
  const router = Router();
  const svc = dashboardService(db);

  router.get("/companies/:productId/dashboard", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    const summary = await svc.summary(productId);
    res.json(summary);
  });

  return router;
}
