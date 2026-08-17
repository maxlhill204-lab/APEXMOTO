import { siteConfig } from "@/config/site";

const topics = new Set(["Sizing", "Stock", "Order", "Pickup", "General question"]);
const clean = (value: unknown, max: number) =>
  typeof value === "string"
    ? [...value]
        .filter((character) => {
          const code = character.charCodeAt(0);
          return character === "\n" || character === "\t" || code >= 32;
        })
        .join("")
        .trim()
        .slice(0, max)
    : "";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ message: "The contact form expects JSON." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 20_000) {
    return Response.json({ message: "Message is too large." }, { status: 413 });
  }
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ message: "Message could not be read." }, { status: 400 }); }
  if (!raw || typeof raw !== "object") return Response.json({ message: "Message could not be read." }, { status: 400 });
  const body = raw as Record<string, unknown>;
  if (body.businessId !== siteConfig.businessId) return Response.json({ message: "Message scope could not be verified." }, { status: 403 });
  if (clean(body.website, 120)) return Response.json({ message: "Message received." });
  const startedAt = Number(body.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86_400_000) {
    return Response.json({ message: "Please reload the form and try again." }, { status: 400 });
  }
  const name = clean(body.name, 80);
  const email = clean(body.email, 160);
  const topic = clean(body.topic, 40);
  const message = clean(body.message, 3000);
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !topics.has(topic) || message.length < 10) {
    return Response.json({ message: "Check your name, email, topic, and message." }, { status: 400 });
  }

  const endpoint = process.env.CONTACT_FORM_ENDPOINT?.trim();
  if (!endpoint) {
    return Response.json(
      {
        message: siteConfig.email
          ? "The contact form is not configured yet. Please use the direct email option."
          : "Contact delivery and the support email are awaiting owner setup. No message was sent.",
      },
      { status: 503 },
    );
  }
  let url: URL;
  try { url = new URL(endpoint); } catch { return Response.json({ message: "The contact form is not configured yet." }, { status: 503 }); }
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) {
    return Response.json({ message: "The contact form is not configured safely." }, { status: 503 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, topic, message, businessId: siteConfig.businessId }),
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Provider rejected the message.");
    return Response.json({ message: "Thanks — your message has been sent." });
  } catch {
    return Response.json(
      {
        message: siteConfig.email
          ? "Your message could not be sent. Please use the direct email option."
          : "Your message could not be sent and the support email is awaiting owner setup.",
      },
      { status: 502 },
    );
  }
}
