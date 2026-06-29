import { Router, type IRouter } from "express";
import healthRouter from "./health";
import providersRouter from "./providers";
import modelsRouter from "./models";
import historyRouter from "./history";
import settingsRouter from "./settings";
import playgroundRouter from "./playground";
import detectionRouter from "./detection";

export const router: IRouter = Router();
export default router;

router.use(healthRouter);
router.use(providersRouter);
router.use(modelsRouter);
router.use(historyRouter);
router.use(settingsRouter);
router.use(playgroundRouter);
router.use(detectionRouter);
