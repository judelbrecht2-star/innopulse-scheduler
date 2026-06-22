import { RoutingManager } from "@/components/dashboard/routing-manager";
import { prisma } from "@/lib/prisma";
import { requireHost } from "@/server/dashboard/require-host";

export default async function RoutingPage() {
  const user = await requireHost(); if (!user?.username) return null;
  const [eventTypes, forms] = await Promise.all([
    prisma.eventType.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.routingForm.findMany({ where: { ownerId: user.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, status: true } }),
  ]);
  return <RoutingManager username={user.username} eventTypes={eventTypes} forms={forms} />;
}
