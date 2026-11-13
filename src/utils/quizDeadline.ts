const timeZone = "America/Sao_Paulo";

export function quizDateTime(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

export function parseQuizDeadline(value: string) {
  const date = new Date(value + "Z");
  if (!Number.isFinite(date.getTime())) return date;
  const offset = new Intl.DateTimeFormat("en", {
    timeZone, timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")!.value;
  return new Date(value + offset.replace("GMT", ""));
}
