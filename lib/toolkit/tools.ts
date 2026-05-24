import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Layers,
} from "lucide-react";
import type { ToolkitToolId } from "./types";

export type ToolkitToolDefinition = {
  id: ToolkitToolId;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

export const TOOLKIT_TOOLS: ToolkitToolDefinition[] = [
  {
    id: "lesson-plan",
    title: "Lesson Plan Builder",
    description:
      "Upload a chapter PDF and get a structured lesson plan with objectives, activities, and homework.",
    href: "/toolkit/lesson-plan",
    icon: ClipboardList,
    accent: "bg-[#eff6ff] text-[#2563eb]",
  },
  {
    id: "worksheet",
    title: "Worksheet Generator",
    description:
      "Create a practice worksheet with mixed question types — lighter than a full exam paper.",
    href: "/toolkit/worksheet",
    icon: FileText,
    accent: "bg-[#f0fdf4] text-[#16a34a]",
  },
  {
    id: "differentiated-papers",
    title: "Differentiated Papers",
    description:
      "Generate Easy, Moderate, and Challenging papers on the same topic for mixed-ability classes.",
    href: "/toolkit/differentiated-papers",
    icon: Layers,
    accent: "bg-[#fff7ed] text-[#ea580c]",
  },
  {
    id: "chapter-summary",
    title: "Chapter Summary",
    description:
      "Turn uploaded material into a one-page revision handout with key points and terms.",
    href: "/toolkit/chapter-summary",
    icon: BookOpen,
    accent: "bg-[#faf5ff] text-[#9333ea]",
  },
];

export function getToolkitTool(id: ToolkitToolId): ToolkitToolDefinition {
  const tool = TOOLKIT_TOOLS.find((entry) => entry.id === id);

  if (!tool) {
    throw new Error(`Unknown toolkit tool: ${id}`);
  }

  return tool;
}
