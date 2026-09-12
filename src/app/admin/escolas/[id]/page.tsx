import { SchoolDetails } from "@/components/screens/SchoolDetails";

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SchoolDetails id={id} />;
}
