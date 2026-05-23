import type { AssignmentListItem } from "@/lib/assignments/types";

export type GroupListItem = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  sharedAssignmentCount: number;
  role: "OWNER" | "MEMBER";
  createdAt: string;
};

export type GroupMember = {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
};

export type SharedAssignmentItem = {
  id: string;
  sharedAt: string;
  sharedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  assignment: AssignmentListItem;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  role: "OWNER" | "MEMBER";
  createdAt: string;
  members: GroupMember[];
  sharedAssignments: SharedAssignmentItem[];
};

export type ListGroupsResponse = {
  groups: GroupListItem[];
};

export type GroupResponse = {
  group: GroupDetail | GroupListItem;
};

export type CreateGroupPayload = {
  name: string;
  description?: string;
};

export type AddGroupMemberPayload = {
  email: string;
};

export type ShareAssignmentPayload = {
  assignmentId: string;
};
