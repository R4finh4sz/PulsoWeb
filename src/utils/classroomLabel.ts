export function classroomLabel(room?: { name: string; identifier?: string | null }) {
  if (!room) return "";
  const identifier = room.identifier?.trim();
  return identifier && !room.name.endsWith(` ${identifier}`)
    ? `${room.name} · ${identifier}`
    : room.name;
}
