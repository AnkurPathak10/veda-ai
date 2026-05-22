export const CREATE_ASSIGNMENT_HREF = "/assignments/create";

export const QUESTION_TYPE_OPTIONS = [
  { value: "mcq", label: "Multiple Choice Questions" },
  { value: "short", label: "Short Questions" },
  { value: "diagram", label: "Diagram/Graph-Based Questions" },
  { value: "numerical", label: "Numerical Problems" },
] as const;

export type QuestionTypeValue = (typeof QUESTION_TYPE_OPTIONS)[number]["value"];

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt", ".text"],
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
