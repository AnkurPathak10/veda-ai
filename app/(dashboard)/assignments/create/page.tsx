import {
  CreateAssignmentHydration,
  CreateAssignmentPageClient,
} from "@/components/create-assignment/create-assignment-page-client";

export default function CreateAssignmentPage() {
  return (
    <>
      <CreateAssignmentHydration />
      <CreateAssignmentPageClient />
    </>
  );
}
