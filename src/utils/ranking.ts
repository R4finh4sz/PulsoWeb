import type { RankingEntry } from "@/integrations/ranking/api";

export type RankingCategory = "correctAnswers" | "completedActivities";

export function rankEntries(
  entries: RankingEntry[],
  category: RankingCategory,
  schoolId = "",
  grade = "",
) {
  const sorted = entries
    .filter((entry) => (!schoolId || entry.schoolId === Number(schoolId)) && (!grade || entry.grade === grade) && entry.completedActivities > 0)
    .sort((a, b) => b[category] - a[category] || a.name.localeCompare(b.name, "pt-BR") || a.studentId - b.studentId);
  let position = 0;
  return sorted.map((entry, index) => {
    if (index === 0 || entry[category] !== sorted[index - 1][category]) position = index + 1;
    return { ...entry, position };
  });
}
