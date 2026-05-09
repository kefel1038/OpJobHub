import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import stripeRouter from "./stripe";
import adminRouter from "./admin";
import aiRouter from "./ai";
import scraperRouter from "./scraper";
import searchRouter from "./search";
import employerRouter from "./employer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobsRouter);
router.use(stripeRouter);
router.use(adminRouter);
router.use("/ai", aiRouter);
router.use("/scraper", scraperRouter);
router.use("/search", searchRouter);
router.use(employerRouter);

export default router;
