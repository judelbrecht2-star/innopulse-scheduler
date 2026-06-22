import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/lib/prisma";
import { emailDeliveryConfigured, sendWorkflowEmail } from "@/server/workflows/email";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}

function absoluteUrl(path: string) {
  return `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

export type ConfirmationEmailTemplateInput = {
  inviteeName: string;
  eventTitle: string;
  hostName: string;
  startAt: Date;
  endAt: Date;
  timeZone: string;
  subject: string;
  message: string;
  agenda: string;
  meetUrl: string | null;
  homeworkLabel: string;
  homeworkUrl: string | null;
  manageUrl: string;
};

export function buildBookingConfirmationEmail(input: ConfirmationEmailTemplateInput) {
  const date = formatInTimeZone(input.startAt, input.timeZone, "EEEE, d MMMM yyyy");
  const time = `${formatInTimeZone(input.startAt, input.timeZone, "h:mm a")} – ${formatInTimeZone(input.endAt, input.timeZone, "h:mm a")}`;
  const agendaItems = input.agenda.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const agendaText = agendaItems.length ? `\nWhat to expect:\n${agendaItems.map((item) => `• ${item}`).join("\n")}` : "";
  const preparationText = input.homeworkUrl && input.homeworkLabel ? `\nPrepare before we meet: ${input.homeworkLabel}\n${input.homeworkUrl}` : "";
  const meetText = input.meetUrl ? `\nGoogle Meet: ${input.meetUrl}` : "";
  const text = `Hi ${input.inviteeName},\n\n${input.message}\n\n${input.eventTitle} with ${input.hostName}\n${date}\n${time}\n${input.timeZone.replaceAll("_", " ")}${meetText}${agendaText}${preparationText}\n\nPlease accept the Google Calendar invitation sent separately to confirm that you will attend.\n\nManage your booking: ${input.manageUrl}\n\nWe look forward to meeting you.\nInnoPulse`;

  const agendaHtml = agendaItems.length ? `<div style="margin:28px 0;padding:22px;border-radius:14px;background:#f7f4ed"><p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#496600">What to expect</p><ul style="margin:0;padding-left:20px;color:#263238;line-height:1.8">${agendaItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : "";
  const meetHtml = input.meetUrl ? `<a href="${escapeHtml(input.meetUrl)}" style="display:inline-block;margin:8px 8px 8px 0;padding:13px 20px;border-radius:10px;background:#182b36;color:#fff;text-decoration:none;font-weight:700">Join Google Meet</a>` : "";
  const homeworkHtml = input.homeworkUrl && input.homeworkLabel ? `<a href="${escapeHtml(input.homeworkUrl)}" style="display:inline-block;margin:8px 0;padding:13px 20px;border-radius:10px;background:#a8e617;color:#182b36;text-decoration:none;font-weight:700">${escapeHtml(input.homeworkLabel)}</a>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f3f1eb;font-family:Arial,sans-serif;color:#182b36"><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="height:7px;border-radius:16px 16px 0 0;background:#a8e617"></div><div style="padding:34px;background:#fff;border:1px solid #e5e1d8;border-top:0;border-radius:0 0 16px 16px"><p style="margin:0 0 22px;font-size:14px;font-weight:700">InnoPulse <span style="font-weight:400;color:#68747a">Scheduling</span></p><h1 style="margin:0;font-size:28px;line-height:1.2">Thank you, ${escapeHtml(input.inviteeName)}.</h1><p style="margin:16px 0 26px;color:#58656b;line-height:1.7">${escapeHtml(input.message).replace(/\n/g, "<br>")}</p><div style="padding:20px;border:1px solid #e5e1d8;border-radius:14px"><p style="margin:0 0 8px;font-weight:700">${escapeHtml(input.eventTitle)}</p><p style="margin:0;color:#58656b;line-height:1.7">With ${escapeHtml(input.hostName)}<br>${escapeHtml(date)}<br>${escapeHtml(time)} · ${escapeHtml(input.timeZone.replaceAll("_", " "))}</p></div>${agendaHtml}<div>${meetHtml}${homeworkHtml}</div><div style="margin-top:26px;padding:18px;border-left:4px solid #a8e617;background:#f7f4ed"><strong>One small final step</strong><p style="margin:6px 0 0;color:#58656b;line-height:1.6">Please accept the Google Calendar invitation sent separately. That confirms your attendance and adds the meeting to your calendar.</p></div><p style="margin:26px 0 0;font-size:13px;color:#68747a">Need to make a change? <a href="${escapeHtml(input.manageUrl)}" style="color:#496600">Manage your booking</a>.</p></div></div></body></html>`;

  return { subject: input.subject, text, html };
}

export async function sendBookingConfirmationEmail(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { calendarEvent: true, host: true, eventType: { include: { owner: { select: { name: true, username: true } } } } },
  });
  if (!booking || booking.status !== "CONFIRMED" || !booking.eventType.confirmationEmailEnabled) return { status: "not_required" as const };
  if (booking.confirmationEmailSentAt) return { status: "already_sent" as const, providerMessageId: booking.confirmationEmailProviderId };
  if (booking.eventType.locationType === "GOOGLE_MEET" && !booking.calendarEvent?.conferenceUrl) return { status: "calendar_pending" as const };
  if (!emailDeliveryConfigured()) return { status: "not_configured" as const };

  const username = booking.eventType.owner.username;
  const manageUrl = username ? absoluteUrl(`/${username}/${booking.eventType.slug}/manage/${booking.uid}`) : absoluteUrl("/");
  const content = buildBookingConfirmationEmail({
    inviteeName: booking.inviteeName,
    eventTitle: booking.eventType.title,
    hostName: booking.host.name ?? booking.eventType.owner.name ?? "the InnoPulse team",
    startAt: booking.startAt,
    endAt: booking.endAt,
    timeZone: booking.inviteeTimeZone,
    subject: booking.eventType.confirmationEmailSubject,
    message: booking.eventType.confirmationEmailMessage,
    agenda: booking.eventType.meetingAgenda,
    meetUrl: booking.calendarEvent?.conferenceUrl ?? null,
    homeworkLabel: booking.eventType.homeworkCtaLabel,
    homeworkUrl: booking.eventType.homeworkCtaUrl,
    manageUrl,
  });
  const providerMessageId = await sendWorkflowEmail({ to: booking.inviteeEmail, ...content });
  await prisma.booking.update({ where: { id: booking.id }, data: { confirmationEmailSentAt: new Date(), confirmationEmailProviderId: providerMessageId } });
  return { status: "sent" as const, providerMessageId };
}
