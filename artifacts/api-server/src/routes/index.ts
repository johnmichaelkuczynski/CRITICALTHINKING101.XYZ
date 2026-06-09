import { Router, type IRouter } from "express";
import healthRouter from "./health";
import courseRouter from "./course";
import assignmentsRouter from "./assignments";
import practiceRouter from "./practice";
import practiceExamsRouter from "./practiceExams";
import tutorRouter from "./tutor";
import detectionRouter from "./detection";
import analyticsRouter from "./analytics";
import diagnosticsRouter from "./diagnostics";
import assessmentsRouter from "./assessments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(courseRouter);
router.use(assignmentsRouter);
router.use(practiceRouter);
router.use(practiceExamsRouter);
router.use(tutorRouter);
router.use(detectionRouter);
router.use(analyticsRouter);
router.use(diagnosticsRouter);
router.use(assessmentsRouter);

export default router;
