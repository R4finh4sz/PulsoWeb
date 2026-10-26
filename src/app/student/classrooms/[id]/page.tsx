import { ClassroomDetailsPage } from "@/components/screens/Integration/Classrooms";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ClassroomDetailsPage id={id} role="aluno" />; }
