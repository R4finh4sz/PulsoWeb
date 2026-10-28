"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { Activities } from "@/components/screens/TeacherActivities";

export default function Page() {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <Activities />
        </TeacherShell>
      )}
    </Protected>
  );
}

