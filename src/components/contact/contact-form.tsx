"use client";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useRef, useState, type FormEvent } from "react";

const topics = ["Sizing", "Stock", "Order", "Pickup", "General question"];

export function ContactForm() {
  const startedAt = useRef(0);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: siteConfig.businessId,
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
          website: form.get("website"),
          startedAt: startedAt.current,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Message could not be sent.");
      setMessage(data.message || "Thanks — your message has been sent.");
      setState("success");
      event.currentTarget.reset();
      trackEvent("click_contact", { method: "form" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Message could not be sent.");
      setState("error");
    }
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={160} autoComplete="email" /></div>
      </div>
      <div className="field"><label htmlFor="topic">Topic</label><select id="topic" name="topic" required defaultValue=""><option value="" disabled>Choose a topic</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select></div>
      <div className="field"><label htmlFor="message">Message</label><textarea id="message" name="message" required minLength={10} maxLength={3000} rows={7} placeholder="Include the product and size if your question is about fit or stock." /></div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="button button--primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
      {message ? <p className={`form-message ${state === "error" ? "form-message--error" : "form-message--success"}`} role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </form>
  );
}
