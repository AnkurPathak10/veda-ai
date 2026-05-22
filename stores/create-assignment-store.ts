import { create } from "zustand";
import type { QuestionTypeValue } from "@/lib/create-assignment/constants";
import { isPastDueDate } from "@/lib/create-assignment/date";
import type { QuestionPaper } from "@/lib/create-assignment/question-paper";
import type {
  CreateAssignmentErrors,
  QuestionTypeRow,
  UploadedFileInfo,
} from "@/lib/create-assignment/types";

function createRow(
  type: QuestionTypeValue,
  count: number,
  marks: number,
): QuestionTypeRow {
  return {
    id: crypto.randomUUID(),
    type,
    count,
    marks,
  };
}

const DEFAULT_ROWS: QuestionTypeRow[] = [
  createRow("mcq", 4, 1),
  createRow("short", 3, 2),
  createRow("diagram", 5, 5),
  createRow("numerical", 5, 5),
];

type CreateAssignmentStep = 1 | 2;

type CreateAssignmentState = {
  step: CreateAssignmentStep;
  uploadedFile: UploadedFileInfo | null;
  isUploading: boolean;
  uploadError: string | null;
  dueDate: string;
  questionRows: QuestionTypeRow[];
  additionalInfo: string;
  errors: CreateAssignmentErrors;
  isGenerating: boolean;
  generationError: string | null;
  questionPaper: QuestionPaper | null;
  setStep: (step: CreateAssignmentStep) => void;
  setUploadedFile: (file: UploadedFileInfo | null) => void;
  setIsUploading: (value: boolean) => void;
  setUploadError: (error: string | null) => void;
  setDueDate: (value: string) => void;
  setAdditionalInfo: (value: string) => void;
  setIsGenerating: (value: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setQuestionPaper: (paper: QuestionPaper | null) => void;
  addQuestionRow: () => void;
  removeQuestionRow: (id: string) => void;
  updateQuestionRow: (
    id: string,
    patch: Partial<Pick<QuestionTypeRow, "type" | "count" | "marks">>,
  ) => void;
  clearErrors: () => void;
  validate: () => boolean;
  reset: () => void;
};

function getTotals(rows: QuestionTypeRow[]) {
  return rows.reduce(
    (acc, row) => ({
      totalQuestions: acc.totalQuestions + row.count,
      totalMarks: acc.totalMarks + row.count * row.marks,
    }),
    { totalQuestions: 0, totalMarks: 0 },
  );
}

export function getAssignmentTotals(rows: QuestionTypeRow[]) {
  return getTotals(rows);
}

export const useCreateAssignmentStore = create<CreateAssignmentState>(
  (set, get) => ({
    step: 1,
    uploadedFile: null,
    isUploading: false,
    uploadError: null,
    dueDate: "",
    questionRows: DEFAULT_ROWS,
    additionalInfo: "",
    errors: {},
    isGenerating: false,
    generationError: null,
    questionPaper: null,

    setStep: (step) => set({ step }),
    setUploadedFile: (file) =>
      set({ uploadedFile: file, uploadError: null, errors: {} }),
    setIsUploading: (value) => set({ isUploading: value }),
    setUploadError: (error) => set({ uploadError: error }),
    setDueDate: (value) => set({ dueDate: value, errors: {} }),
    setAdditionalInfo: (value) => set({ additionalInfo: value }),
    setIsGenerating: (value) => set({ isGenerating: value }),
    setGenerationError: (error) => set({ generationError: error }),
    setQuestionPaper: (paper) => set({ questionPaper: paper }),

    addQuestionRow: () =>
      set((state) => ({
        questionRows: [
          ...state.questionRows,
          createRow("mcq", 1, 1),
        ],
        errors: {},
      })),

    removeQuestionRow: (id) =>
      set((state) => {
        if (state.questionRows.length <= 1) {
          return state;
        }

        return {
          questionRows: state.questionRows.filter((row) => row.id !== id),
          errors: {},
        };
      }),

    updateQuestionRow: (id, patch) =>
      set((state) => ({
        questionRows: state.questionRows.map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
        errors: {},
      })),

    clearErrors: () => set({ errors: {} }),

    validate: () => {
      const { uploadedFile, dueDate, questionRows } = get();
      const errors: CreateAssignmentErrors = { rows: {} };

      if (!uploadedFile) {
        errors.file = "Please upload a PDF or text file";
      }

      if (!dueDate.trim()) {
        errors.dueDate = "Due date is required";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        errors.dueDate = "Enter a valid due date";
      } else if (isPastDueDate(dueDate)) {
        errors.dueDate = "Due date cannot be in the past";
      }

      if (questionRows.length === 0) {
        errors.questionTypes = "Add at least one question type";
      }

      for (const row of questionRows) {
        const rowErrors: { type?: string; count?: string; marks?: string } = {};

        if (!row.type) {
          rowErrors.type = "Select a question type";
        }

        if (!Number.isInteger(row.count) || row.count < 1) {
          rowErrors.count = "Must be at least 1";
        }

        if (!Number.isInteger(row.marks) || row.marks < 1) {
          rowErrors.marks = "Must be at least 1";
        }

        if (Object.keys(rowErrors).length > 0) {
          errors.rows![row.id] = rowErrors;
        }
      }

      if (errors.rows && Object.keys(errors.rows).length === 0) {
        delete errors.rows;
      }

      const hasErrors =
        Boolean(errors.file) ||
        Boolean(errors.dueDate) ||
        Boolean(errors.questionTypes) ||
        Boolean(errors.rows && Object.keys(errors.rows).length > 0);

      set({ errors: hasErrors ? errors : {} });
      return !hasErrors;
    },

    reset: () =>
      set({
        step: 1,
        uploadedFile: null,
        isUploading: false,
        uploadError: null,
        dueDate: "",
        questionRows: DEFAULT_ROWS.map((row) => ({ ...row, id: crypto.randomUUID() })),
        additionalInfo: "",
        errors: {},
        isGenerating: false,
        generationError: null,
        questionPaper: null,
      }),
  }),
);
