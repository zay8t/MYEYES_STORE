import React from "react";
import { prisma } from "@/lib/prisma";
import AdminLeadsClient from "./AdminLeadsClient";

export const revalidate = 0;

export default async function AdminLeadsPage() {
  let leads: { id: string; name: string; age: number; whatsapp: string; frameId: string | null; status: string; createdAt: Date }[] = [];

  try {
    leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Leads page DB error:", error);
  }

  return <AdminLeadsClient initialLeads={leads} />;
}
