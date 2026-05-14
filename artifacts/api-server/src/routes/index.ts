import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import stripeRouter from "./stripe";
import adminRouter from "./admin";
import aiRouter from "./ai";
import scraperRouter from "./scraper";
import searchRouter from "./search";
import resourcesRouter from "./resources";
import employerRouter from "./employer";
import freelanceRouter from "./freelance";
import extensionRouter from "./extension";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobsRouter);
router.use(stripeRouter);
router.use(adminRouter);
router.use("/ai", aiRouter);
router.use("/scraper", scraperRouter);
router.use("/search", searchRouter);
router.use("/resources", resourcesRouter);
router.use(employerRouter);
router.use(freelanceRouter);
router.use(extensionRouter);
router.use(agentsRouter);

export default router;
