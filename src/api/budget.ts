import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware';
import { getMonthlyBudgetView } from '../services/budget-service';

const router = Router();
router.use(authenticate);

router.get('/me/budget', async (req: Request, res: Response) => {
  const view = await getMonthlyBudgetView(req.userId!);
  res.status(200).json({ data: view });
});

export default router;
