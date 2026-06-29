import { Router, type IRouter } from "express";
import { DetectProviderBody } from "@workspace/api-zod";
import { detectProvider } from "../lib/detection";

const router: IRouter = Router();

// POST /detect
router.post("/detect", async (req, res): Promise<void> => {
  const parsed = DetectProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { apiKey, baseUrl, endpoint } = parsed.data;
  const result = detectProvider(apiKey, baseUrl, endpoint);
  res.json(result);
});

export default router;
