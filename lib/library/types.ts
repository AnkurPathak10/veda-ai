import type { ToolkitResult, ToolkitToolId } from "@/lib/toolkit/types";

export type LibraryListItem = {
  id: string;
  tool: ToolkitToolId;
  title: string;
  createdAt: string;
};

export type SavedLibraryItem = LibraryListItem & {
  content: ToolkitResult;
};

export type ListLibraryResponse = {
  items: LibraryListItem[];
  total: number;
};

export type LibraryItemResponse = {
  item: SavedLibraryItem;
};

export type SaveLibraryItemPayload = {
  tool: ToolkitToolId;
  title: string;
  content: ToolkitResult;
};

export type SaveLibraryItemResponse = {
  item: LibraryListItem;
};
