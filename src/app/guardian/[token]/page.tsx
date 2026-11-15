import { GuardianDecisionScreen } from "@/components/screens/Guardian/Decision";

export default async function GuardianPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuardianDecisionScreen token={token} />;
}
