import type { SubjectInvitation } from "@/integrations/subjects/api";

export const demoSubjectInvitations: SubjectInvitation[] = [
  {
    id: 1,
    subjectId: 2,
    classroomId: 1,
    subjectName: "Ciências",
    inviterName: "Mariana Souza",
    email: "professor@pulso.com",
    status: "PENDING",
  },
];
