type LogLevel = "info" | "warn" | "error";

export function operationalLog(level: LogLevel, event: string, evidence: Record<string, unknown> = {}) {
  const safeEvidence = Object.fromEntries(
    Object.entries(evidence).filter(([key]) => !/email|name|address|secret|token|key/i.test(key)),
  );
  process.stderr.write(`${JSON.stringify({ level, event, at: new Date().toISOString(), ...safeEvidence })}\n`);
}
