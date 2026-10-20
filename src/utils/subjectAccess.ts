import type { Subject } from "@/integrations/types";

export function canAccessSubject(subject: Subject, teacherId: number) {
  return (
    subject.teacherId === teacherId || !!subject.teacherIds?.includes(teacherId)
  );
}
