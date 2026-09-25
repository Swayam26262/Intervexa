/**
 * Transactional email via Resend's HTTP API. Without RESEND_API_KEY, emails are logged
 * (with their links) so local development works end to end.
 */
import { logger } from "./logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function appUrl(): string {
  return (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info("email (not sent: RESEND_API_KEY unset)", { to: message.to, subject: message.subject, text: message.text });
    return { delivered: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Intervexa <onboarding@resend.dev>",
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    logger.error("email delivery failed", { to: message.to, status: res.status, body: await res.text().catch(() => "") });
    return { delivered: false };
  }
  return { delivered: true };
}

/** Simple, accessible, client-safe HTML email layout. */
export function emailLayout({ heading, body, cta }: { heading: string; body: string; cta?: { label: string; url: string } }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f2fc;font-family:Arial,Helvetica,sans-serif;color:#1c1b21">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;padding:32px">
<tr><td style="font-size:18px;font-weight:700;color:#5b4bd6;padding-bottom:24px">Intervexa</td></tr>
<tr><td style="font-size:22px;font-weight:700;padding-bottom:12px">${heading}</td></tr>
<tr><td style="font-size:15px;line-height:22px;color:#47464f;padding-bottom:24px">${body}</td></tr>
${cta ? `<tr><td style="padding-bottom:24px"><a href="${cta.url}" style="display:inline-block;background:#5b4bd6;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${cta.label}</a></td></tr>
<tr><td style="font-size:12px;color:#787680;word-break:break-all">Or paste this link into your browser:<br>${cta.url}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}
