import type { QuestionPaper } from "@/lib/create-assignment/question-paper";
import type { QuestionTypeRow, UploadedFileInfo } from "@/lib/create-assignment/types";

export type AssignmentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type AssignmentListItem = {
  id: string;
  title: string;
  dueDate: string | null;
  assignedDate: string;
  status: AssignmentStatus;
  hasQuestionPaper: boolean;
};

export type SavedAssignment = AssignmentListItem & {
  additionalInfo: string | null;
  uploadedFile: UploadedFileInfo | null;
  questionRows: Array<Pick<QuestionTypeRow, "type" | "count" | "marks">> | null;
  questionPaper: QuestionPaper | null;
};

export type CreateAssignmentPayload = {
  title?: string;
  dueDate: string;
  additionalInfo?: string;
  uploadedFile: UploadedFileInfo;
  questionRows: Array<Pick<QuestionTypeRow, "type" | "count" | "marks">>;
  questionPaper: QuestionPaper;
};

export type ListAssignmentsResponse = {
  assignments: AssignmentListItem[];
  total: number;
};

export type AssignmentResponse = {
  assignment: SavedAssignment;
};

export type CreateAssignmentResponse = AssignmentResponse;
