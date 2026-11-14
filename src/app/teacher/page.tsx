"use client";

import { TeacherShell } from "@/components/screens/Dashboard/TeacherShell";
import {
  Protected
} from "@/components/screens/Integration/shared";
import { SchoolChoices } from "@/components/screens/TeacherHome";

export default function Page() {
  return (
    <Protected role="professor">
      {(user) => (
        <TeacherShell user={user}>
          <SchoolChoices />
        </TeacherShell>
      )}
    </Protected>
  );
}

