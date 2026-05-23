import { GroupDetailPage } from "@/components/groups/group-detail-page";

type GroupDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupDetailRoutePage({
  params,
}: GroupDetailRoutePageProps) {
  const { id } = await params;
  return <GroupDetailPage groupId={id} />;
}
