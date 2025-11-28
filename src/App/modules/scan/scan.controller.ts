// src/App/modules/scan/scan.controller.ts
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import ScanModel from "./scan.model";
import { processScanGamification } from "../gamification/gamification.service";
import { ENV } from "../../Config/env";
import dayjs from "dayjs";

function computeWellnessScore(ml: any) {
  // deterministic formula for demo
  const faceStress = ml?.face?.stress_score ?? 0;
  const voiceStress = ml?.voice?.stress_indicator ? ml.voice.stress_indicator * 100 : 0;
  const avg = (faceStress + voiceStress) / ( (ml?.face ? 1 : 0) + (ml?.voice ? 1 : 0) || 1 );
  const score = Math.max(0, Math.round(100 - avg));
  return score;
}

export async function handleScan(req: Request, res: Response) {
  const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const imageFile = files?.image?.[0];
  const audioFile = files?.audio?.[0];

  if (!imageFile && !audioFile) {
    return res.status(400).json({ error: "Provide image or audio." });
  }

  // Mock ML inference
  const mlResult: any = {
    face: imageFile ? { mood: "neutral", stress_score: Math.floor(Math.random() * 50), fatigue_score: Math.floor(Math.random() * 40), confidence: 0.8 } : null,
    voice: audioFile ? { emotion: "neutral", stress_indicator: Math.random() * 0.6, energy: Math.random(), confidence: 0.75 } : null,
  };

  const wellnessScore = computeWellnessScore(mlResult);

  // Save record
  const scan = await ScanModel.create({
    user: user._id,
    imagePath: imageFile ? path.basename(imageFile.path) : undefined,
    audioPath: audioFile ? path.basename(audioFile.path) : undefined,
    mlResult,
    wellnessScore,
  });

  // Update gamification
  const gamify = await processScanGamification(user._id.toString(), dayjs().toDate());

  // Prepare suggestions: premium users get extended suggestions
  const suggestions = [
    "Take 3 deep breaths for 2 minutes",
    "Short 10-minute walk",
    "Drink a glass of water",
  ];

  const premiumSuggestions = [
    "Guided 10-minute breathing session (audio)",
    "Personalized micro-workout for energy",
    "Sleep hygiene plan for the week"
  ];

  const response: any = {
    scanId: scan._id,
    timestamp: scan.createdAt,
    mlResult,
    wellnessScore,
    suggestions: suggestions,
    gamification: gamify,
  };

  if ((user as any).plan === "premium") {
    response.suggestions = suggestions.concat(premiumSuggestions);
    response.premium = true;
  } else {
    response.premium = false;
    // Limit to free suggestions only
  }

  return res.json(response);
}
