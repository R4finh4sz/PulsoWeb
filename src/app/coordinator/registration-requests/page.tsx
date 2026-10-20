import { RegistrationRequests } from "@/components/screens/Registration/Requests";
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <RegistrationRequests
      key={type}
      role="coordenador"
      initialType={type === "deletion" ? "DELETION" : "TEACHER"}
    />
  );
}
