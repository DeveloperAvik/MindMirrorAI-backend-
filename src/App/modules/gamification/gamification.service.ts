import dayjs from "dayjs";
import UserModel from "../user/user.model";

const BADGES = {
  "streak-3": { key: "streak-3", title: "3 Day Streak" },
  "streak-7": { key: "streak-7", title: "7 Day Streak" },
  "streak-30": { key: "streak-30", title: "30 Day Streak" },
};

export async function processScanGamification(userId: string, scanDate = new Date()) {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  const last = user.lastScanAt ? dayjs(user.lastScanAt) : null;
  const now = dayjs(scanDate);

  // Determine streak update:
  let newStreak = 1;
  if (last) {
    const diffDays = now.startOf("day").diff(last.startOf("day"), "day");
    if (diffDays === 0) {
      // same day — keep streak
      newStreak = user.streakCount || 1;
    } else if (diffDays === 1) {
      // consecutive day
      newStreak = (user.streakCount || 0) + 1;
    } else {
      // break
      newStreak = 1;
    }
  }

  user.streakCount = newStreak;
  user.lastScanAt = now.toDate();

  // Award badges for milestones
  const awarded: string[] = [];
  if (newStreak >= 3 && !user.badges.includes(BADGES["streak-3"].key)) {
    user.badges.push(BADGES["streak-3"].key);
    awarded.push(BADGES["streak-3"].key);
  }
  if (newStreak >= 7 && !user.badges.includes(BADGES["streak-7"].key)) {
    user.badges.push(BADGES["streak-7"].key);
    awarded.push(BADGES["streak-7"].key);
  }
  if (newStreak >= 30 && !user.badges.includes(BADGES["streak-30"].key)) {
    user.badges.push(BADGES["streak-30"].key);
    awarded.push(BADGES["streak-30"].key);
  }

  await user.save();
  return { streakCount: user.streakCount, awarded, badges: user.badges };
}
