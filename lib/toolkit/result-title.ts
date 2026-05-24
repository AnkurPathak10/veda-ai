import type {
  ChapterSummary,
  DifferentiatedPapers,
  LessonPlan,
  ToolkitResult,
  ToolkitToolId,
  Worksheet,
} from "@/lib/toolkit/types";

export function getToolkitResultTitle(
  tool: ToolkitToolId,
  result: ToolkitResult,
): string {
  switch (tool) {
    case "lesson-plan":
      return (result as LessonPlan).title;
    case "worksheet":
      return (result as Worksheet).title;
    case "differentiated-papers": {
      const papers = result as DifferentiatedPapers;
      const subject = papers.variants[0]?.header.subject ?? "Topic";
      return `Differentiated Papers: ${subject}`;
    }
    case "chapter-summary":
      return (result as ChapterSummary).title;
  }
}

export const TOOLKIT_TOOL_LABELS: Record<ToolkitToolId, string> = {
  "lesson-plan": "Lesson Plan",
  worksheet: "Worksheet",
  "differentiated-papers": "Differentiated Papers",
  "chapter-summary": "Chapter Summary",
};
