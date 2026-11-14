import type { SchoolInvitation } from "@/integrations/schools/api";
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

export const demoSchoolInvitations: SchoolInvitation[] = [
  {
    id: 1,
    schoolId: 4,
    schoolName: "Escola Estadual Parque das Árvores",
    inviterName: "Coordenação da Escola Estadual Parque das Árvores",
    email: "professor@pulso.com",
    status: "PENDING",
  },
];
