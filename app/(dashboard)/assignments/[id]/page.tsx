import { AssignmentDetail } from "@/components/assignments/assignment-detail";

type AssignmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssignmentDetailPage({
  params,
}: AssignmentDetailPageProps) {
  const { id } = await params;

  return <AssignmentDetail assignmentId={id} />;
}
