import { Registration } from "@/components/screens/Registration";
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <Registration token={token} />;
}
