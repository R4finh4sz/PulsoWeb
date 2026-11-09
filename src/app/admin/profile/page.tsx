"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import { Protected } from "@/components/screens/Integration/shared";
import { Profile } from "@/components/screens/TeacherProfile";

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
        <TeacherShell user={user}>
          <Profile user={user} />
        </TeacherShell>
      )}
    </Protected>
  );
}
