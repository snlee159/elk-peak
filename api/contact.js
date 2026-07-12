/**
 * Vercel serverless function: sends contact form submissions via Resend.
 * Requires the RESEND_API_KEY environment variable in the Vercel project.
 */

const CONTACT_EMAIL = "contact@elkpeakconsulting.com";
// Sender must be on a domain verified in Resend
const FROM_ADDRESS = "Elk Peak Website <noreply@elkpeakconsulting.com>";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, company, message } = req.body || {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if (name.length > 200 || email.length > 200 || (company || "").length > 200 || message.length > 5000) {
    return res.status(400).json({ error: "One or more fields exceed the allowed length." });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set for this deployment/environment");
    return res.status(502).json({ error: "Failed to send message. Please try again or email us directly." });
  }

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: `Website inquiry from ${name}`,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend error:", response.status, detail);
    return res.status(502).json({ error: "Failed to send message. Please try again or email us directly." });
  }

  return res.status(200).json({ success: true });
}
