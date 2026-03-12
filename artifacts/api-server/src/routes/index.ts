import { Router, type IRouter } from "express";
import healthRouter from "./health";
import worktrackRouter from "./worktrack";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/worktrack", worktrackRouter);

export default router;
