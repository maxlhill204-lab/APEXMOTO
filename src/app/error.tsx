"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep customer-facing errors generic. A configured monitoring provider can
    // receive the digest later without exposing stack traces in the interface.
    void error.digest;
  }, [error]);
  return <div className="page-shell status-page"><div className="status-card"><CircleAlert aria-hidden="true" /><p className="eyebrow eyebrow--accent">Something went wrong</p><h1>This section didn’t load.</h1><p>Try again. If the problem continues, return to the shop or contact the store.</p><div className="button-row"><button type="button" className="button button--primary" onClick={reset}>Try again</button><Link className="button button--secondary" href="/shop">Go to shop</Link></div></div></div>;
}
