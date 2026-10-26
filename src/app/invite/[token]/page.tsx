import { Registration } from "@/components/screens/Registration";
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <Registration token={token} />;
}
