// Waitlist signup: saves the email as a Resend contact, then sends one welcome email.
// Needs the env var RESEND_API_KEY (set in Vercel, never in this repo).
// Optional: WAITLIST_FROM, WAITLIST_REPLY_TO.
// shortcut: no rate limit beyond "one welcome email per new address"; add Vercel WAF or Upstash if abused.

const FROM = process.env.WAITLIST_FROM || "Abhi from Werkbot <abhi@updates.werkbot.xyz>";
const REPLY_TO = process.env.WAITLIST_REPLY_TO || "abhi@werkbot.xyz";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const WELCOME_TEXT = `Hi,

You are on the Werkbot waitlist. Thank you.

Werkbot is a self-learning agent for your whole job search. It finds the roles, writes the CV, fills the forms in a background browser, and learns from every answer you give, so it asks less each time. It never guesses and never sends without your click.

We are building it now. When early access opens, you will get one email from this address.

If you want to talk, just reply to this message. It reaches me directly. If you want off the list, reply with "remove" and I will do it.

Abhi
Werkbot
https://werkbot.xyz
`;

const WELCOME_HTML = `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f7f9;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#0b0b0f;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ececf0;border-radius:16px;padding:32px;line-height:1.55;font-size:16px;">
<p style="margin:0 0 16px;">Hi,</p>
<p style="margin:0 0 16px;">You are on the Werkbot waitlist. Thank you.</p>
<p style="margin:0 0 16px;">Werkbot is a self-learning agent for your whole job search. It finds the roles, writes the CV, fills the forms in a background browser, and learns from every answer you give, so it asks less each time. It never guesses and never sends without your click.</p>
<p style="margin:0 0 16px;">We are building it now. When early access opens, you will get one email from this address.</p>
<p style="margin:0 0 24px;color:#5f6470;">If you want to talk, reply to this message. It reaches me directly. If you want off the list, reply with &quot;remove&quot;.</p>
<p style="margin:0;">Abhi<br><a href="https://werkbot.xyz" style="color:#2F5BEA;text-decoration:none;">werkbot.xyz</a></p>
</div></body></html>`;

function reply(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json(body);
}

async function resend(path, payload) {
  const r = await fetch("https://api.resend.com" + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await r.json(); } catch (_) {}
  return { ok: r.ok, status: r.status, data };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { ok: false, error: "method_not_allowed" });
  }
  if (!process.env.RESEND_API_KEY) {
    return reply(res, 500, { ok: false, error: "not_configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  body = body || {};

  // Honeypot: real visitors never fill the hidden "website" field.
  if (body.website) return reply(res, 200, { ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  if (email.length > 320 || !EMAIL_RE.test(email)) {
    return reply(res, 400, { ok: false, error: "invalid_email" });
  }

  const contact = await resend("/contacts", { email, unsubscribed: false });
  if (!contact.ok) {
    const msg = JSON.stringify(contact.data || "").toLowerCase();
    // Already on the list: say success, send nothing (stops the form being used to mail strangers repeatedly).
    if (contact.status === 409 || msg.includes("already exist")) {
      return reply(res, 200, { ok: true, already: true });
    }
    console.error("resend contact failed", contact.status, contact.data);
    return reply(res, 502, { ok: false, error: "upstream" });
  }

  const mail = await resend("/emails", {
    from: FROM,
    to: [email],
    reply_to: REPLY_TO,
    subject: "You are on the Werkbot waitlist",
    text: WELCOME_TEXT,
    html: WELCOME_HTML,
  });
  if (!mail.ok) {
    // The contact is saved; the welcome email failing should not show the visitor an error.
    console.error("resend email failed", mail.status, mail.data);
  }
  return reply(res, 200, { ok: true });
};
