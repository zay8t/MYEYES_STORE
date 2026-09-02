import React from "react";
import { prisma } from "@/lib/prisma";
import AdminLeadsClient, { type LeadItem } from "./AdminLeadsClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  let leads: LeadItem[] = [];

  try {
    leads = await prisma.lead.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Leads page DB error:", error);
  }

  return <AdminLeadsClient initialLeads={leads} />;
}
