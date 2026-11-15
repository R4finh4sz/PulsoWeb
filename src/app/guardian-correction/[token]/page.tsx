import { GuardianCorrectionScreen } from "@/components/screens/Guardian/Correction";

export default async function GuardianCorrectionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuardianCorrectionScreen token={token} />;
}
