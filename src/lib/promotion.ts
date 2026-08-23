export function formatPromotionCountdown(deadline: string, now: number) {
  const remainingMilliseconds = new Date(deadline).getTime() - now;
  if (!Number.isFinite(remainingMilliseconds) || remainingMilliseconds <= 0) return "SALE ENDED";

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
}
