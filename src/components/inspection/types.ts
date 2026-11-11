import type { ItemResult } from "@/lib/constants";

export type PhotoDraft = {
  id: string;
  path?: string;
  preview: string;
  caption: string;
  phase: "normal" | "before" | "after";
  taken_at: string;
  status: "uploading" | "done" | "error";
};

export type ItemDraft = {
  result?: ItemResult;
  note: string;
  proposal: string;
  photos: PhotoDraft[];
  // bảo trì
  model?: string;
  before_status?: ItemResult;
  tasks?: string[];
  work_extra?: string;
  materials?: string;
  completion?: "done" | "partial" | "not_done";
};

export type TemplateSection = {
  id: number;
  code: string;
  title: string;
  equipment_label: string | null;
  default_count: number;
  items: { id: number; code: string; text: string }[];
};

export type StoreLite = { id: string; code: string; name: string; address: string | null; open_date: string | null };
