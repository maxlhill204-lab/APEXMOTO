"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en-AU"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#050505", color: "#f5f2e8", fontFamily: "system-ui", padding: 24, textAlign: "center" }}><div><h1>APEX MOTO</h1><p>The store could not load.</p><button type="button" onClick={reset} style={{ minHeight: 48, padding: "0 20px", background: "#d9a827", border: 0, fontWeight: 800, cursor: "pointer" }}>TRY AGAIN</button></div></main></body></html>;
}
