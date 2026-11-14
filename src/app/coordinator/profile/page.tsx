"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Profile } from "@/components/screens/TeacherProfile";

function PageContent({
  role = "professor",
}: {
  role?: "professor" | "coordenador";
}) {
  return (
    <Protected role={role}>
      {(user) => (
        <TeacherShell user={user}>
          <Profile user={user} />
        </TeacherShell>
      )}
    </Protected>
  );
}

export default function Page() {
  return <PageContent role="coordenador" />;
}
