export type Classroom = {
  id: string;
  schoolId: string;
  name: string;
  identifier?: string;
  period: string;
  students: number;
  teacherIds: string[];
  color: string;
};
