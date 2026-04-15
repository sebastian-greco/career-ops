import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

import type { StatusId, StatusOption } from "@/lib/dashboard/types";

interface StatusCatalogFile {
  states: Array<{
    id: StatusId;
    label: string;
    aliases?: string[];
    description?: string;
    dashboard_group?: StatusId;
  }>;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

export async function loadStatusCatalog(careerOpsRoot: string) {
  const filePath = path.join(careerOpsRoot, "templates", "states.yml");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = yaml.load(raw) as StatusCatalogFile;

  return parsed.states.map<StatusOption>((state) => ({
    id: state.id,
    label: state.label,
    aliases: state.aliases ?? [],
    description: state.description ?? "",
    dashboardGroup: state.dashboard_group ?? state.id,
  }));
}

export function normalizeStatus(rawStatus: string, statuses: StatusOption[]) {
  const stripped = rawStatus.replaceAll("**", "").trim();
  const lowered = normalizeToken(
    stripped.replace(/\s20\d{2}-\d{2}-\d{2}$/, "").trim(),
  );

  for (const status of statuses) {
    const tokens = [status.id, status.label, ...status.aliases].map(normalizeToken);
    if (tokens.includes(lowered)) {
      return status.id;
    }
  }

  if (lowered.includes("geo blocker")) {
    return "skip";
  }

  return lowered;
}
