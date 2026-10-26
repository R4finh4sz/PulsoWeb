export type School = {
  id: string;
  name: string;
  street?: string;
  state?: string;
  city: string;
  coordinatorId: string | null;
  initials: string;
};
