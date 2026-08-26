type LogLevel = "info" | "warn" | "error";

function safeLogText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:cs|pi|ch|cus|evt|pm)_(?:test_|live_)?[A-Za-z0-9_]+\b/g, "[redacted-stripe-id]")
    .slice(0, 400);
}

export function operationalErrorEvidence(error: unknown) {
  const candidate = error && typeof error === "object"
    ? error as { name?: unknown; message?: unknown; code?: unknown; constraint?: unknown; routine?: unknown }
    : null;
  return {
    errorType: typeof candidate?.name === "string" ? candidate.name.slice(0, 80) : typeof error,
    errorCode: typeof candidate?.code === "string" ? candidate.code.slice(0, 40) : null,
    errorConstraint: typeof candidate?.constraint === "string" ? candidate.constraint.slice(0, 120) : null,
    errorRoutine: typeof candidate?.routine === "string" ? candidate.routine.slice(0, 120) : null,
    errorMessage: typeof candidate?.message === "string" ? safeLogText(candidate.message) : "Unknown error",
  };
}

export function operationalLog(level: LogLevel, event: string, evidence: Record<string, unknown> = {}) {
  const safeEvidence = Object.fromEntries(
    Object.entries(evidence).filter(([key]) => !/email|name|address|secret|token|key/i.test(key)),
  );
  process.stderr.write(`${JSON.stringify({ level, event, at: new Date().toISOString(), ...safeEvidence })}\n`);
}
