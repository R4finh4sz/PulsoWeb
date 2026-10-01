import { ClassroomDetails } from "@/components/screens/ClassroomDetails";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassroomDetails id={id} role="professor" />;
}

