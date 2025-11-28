// src/App/Config/mailer.ts
import nodemailer from "nodemailer";
import { ENV } from "./env";

let transporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (transporter) return transporter;
  if (!ENV.EMAIL_USER || !ENV.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    } as any);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: ENV.EMAIL_SERVICE || "gmail",
    auth: {
      user: ENV.EMAIL_USER,
      pass: ENV.EMAIL_PASS,
    },
  });

  return transporter;
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string; }) {
  const t = getTransporter();
  const info = await t.sendMail({
    from: ENV.EMAIL_USER,
    to,
    subject,
    html,
    text,
  } as any);

  if ((info as any).message) {
    console.log("[DEV MAILER] message:", (info as any).message.toString());
  } else {
    console.log("[MAIL] sent:", info.messageId ?? info);
  }
  return info;
}
