"use client";
import { classroomLabel } from "@/utils/classroomLabel";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomsApi, type ClassroomDeliberation } from "@/integrations/classrooms/api";
import { FeedbackModal } from "@/components/ui/FeedbackModal";
import { showRequestError } from "@/store/feedbackStore";
import type { Classroom } from "@/integrations/types";
import { ErrorMessage, actionClass, fieldClass } from "@/components/screens/Integration/shared";

type Result = "APPROVED" | "FAILED";

export function Deliberation({ room }: { room: Classroom }) {
  const client = useQueryClient();
  const router = useRouter();
  const students = useQuery({
    queryKey: ["classrooms", room.id, "students"],
    queryFn: ({ signal }) => classroomsApi.students(room.id, signal),
  });
  const rooms = useQuery({ queryKey: ["classrooms"], queryFn: ({ signal }) => classroomsApi.list(signal) });
  const [selected, setSelected] = useState<number[]>([]);
  const destinationDialog = useRef<HTMLDialogElement>(null);
  const [results, setResults] = useState<Record<number, Result>>({});
  const [studentDestinations, setStudentDestinations] = useState<Record<number, number | null>>({});
  const [batchResult, setBatchResult] = useState<Result>("APPROVED");
  const [mode, setMode] = useState<"TRANSFER" | "GRADUATE">("TRANSFER");
  const [confirming, setConfirming] = useState(false);
  const [completed, setCompleted] = useState(false);
  const submit = useMutation({
    mutationFn: classroomsApi.deliberate,
    onSuccess: async () => {
      setConfirming(false);
      setCompleted(true);
      await Promise.all(["classrooms", "users", "subjects", "schools", "metrics", "teacher-report", "teacher-activities"].map((key) =>
        client.invalidateQueries({ queryKey: [key], refetchType: "none" }),
      ));
    },
    onError: (error) => { setConfirming(false); showRequestError(error); },
  });
  const [targetRoom, setTargetRoom] = useState("");
  const [graduating, setGraduating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const roster = students.data ?? [];
  const destinations = (rooms.data ?? []).filter((destination) =>
    destination.id !== room.id && room.schoolId != null && destination.schoolId === room.schoolId,
  );
  const approved = roster.filter((student) => results[student.id] === "APPROVED").length;
  const failed = roster.filter((student) => results[student.id] === "FAILED").length;
  const pending = roster.length - approved - failed;
  const validDestination = (id: string) => destinations.some((destination) => String(destination.id) === id);
  const ready = students.isSuccess && roster.length > 0 && pending === 0 && (
    graduating ? failed === 0 : rooms.isSuccess &&
      roster.every((student) => validDestination(String(studentDestinations[student.id])))
  );
  const payload: ClassroomDeliberation = {
    classroomId: room.id,
    action: graduating ? "GRADUATE" : "TRANSFER",
    students: roster.map((student) => ({
      studentId: student.id,
      result: results[student.id],
      destinationClassroomId: studentDestinations[student.id],
    })),
  };
  const canGraduate = batchResult === "APPROVED" && roster.every((student) => selected.includes(student.id));
  const canApply = selected.length > 0 && (mode === "GRADUATE" ? canGraduate : rooms.isSuccess && validDestination(targetRoom));
  function openDestination(result: Result) {
    setBatchResult(result);
    setMode("TRANSFER");
    setTargetRoom("");
    destinationDialog.current?.showModal();
  }
  function apply() {
    if (!canApply) return;
    setResults((current) => ({ ...current, ...Object.fromEntries(selected.map((id) => [id, batchResult])) }));
    setStudentDestinations((current) => ({ ...current, ...Object.fromEntries(selected.map((id) => [id, mode === "GRADUATE" ? null : Number(targetRoom)])) }));
    setGraduating(mode === "GRADUATE");
    setSelected([]);
    setReviewing(false);
    destinationDialog.current?.close();
  }
  return (
    <section aria-label="Deliberação" className="space-y-6 rounded-2xl bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">Deliberação da turma</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">Selecione os alunos e registre aprovação ou reprovação. Defina o resultado de todos os alunos para revisar a deliberação completa.</p>
        <p className="mt-2 text-sm leading-6 text-(--muted)">A confirmação final aplica os resultados e altera os vínculos dos alunos. O rascunho é perdido ao sair desta seção.</p>
      </div>
      {students.isPending && <p role="status">Carregando alunos…</p>}
      <ErrorMessage error={students.error} />
      {students.isError && <button className={actionClass} onClick={() => students.refetch()}>Tentar novamente</button>}
      {students.isSuccess && !roster.length && <p>Nenhum aluno vinculado à turma para deliberar.</p>}
      {roster.length > 0 && !completed && <>
        <div className="flex flex-wrap items-center gap-3 border-b border-(--line) pb-4">
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={roster.every((student) => selected.includes(student.id))} onChange={(event) => setSelected(event.target.checked ? roster.map((student) => student.id) : [])} />Selecionar todos</label>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" disabled={!selected.length} className={actionClass} onClick={() => openDestination("APPROVED")}>Aprovar</button>
            <button type="button" disabled={!selected.length} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm text-red-700 disabled:opacity-50" onClick={() => openDestination("FAILED")}>Reprovar</button>
          </div>
        </div>
        <ul className="divide-y divide-(--line)">
          {roster.map((student) => <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <label className="flex min-h-11 min-w-0 items-center gap-3 text-sm"><input type="checkbox" checked={selected.includes(student.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /><span className="break-words">{student.fullName}<span className="mt-1 block text-xs text-(--muted)">RA: {student.ra || "Não informado"}</span></span></label>
            <span className={`text-sm font-medium ${results[student.id] === "APPROVED" ? "text-green-700" : results[student.id] === "FAILED" ? "text-red-700" : "text-(--muted)"}`}>{results[student.id] === "APPROVED" ? "Aprovado" : results[student.id] === "FAILED" ? "Reprovado" : "Pendente"}</span>
          </li>)}
        </ul>
        <dialog
          ref={destinationDialog}
          aria-labelledby="deliberation-destination-title"
          className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),640px)] overflow-y-auto rounded-[20px] bg-white p-0 shadow-2xl backdrop:bg-black/70"
        >
        <div className="space-y-6 px-6 py-8 sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <h2 id="deliberation-destination-title" className="text-xl font-semibold">{batchResult === "APPROVED" ? "Aprovar alunos" : "Reprovar alunos"}</h2>
            <button type="button" autoFocus onClick={() => destinationDialog.current?.close()} className="min-h-11 rounded-lg px-3 text-sm text-(--blue-dark)">Fechar</button>
          </div>
        <fieldset className="space-y-3 border-t border-(--line) pt-5">
          <legend className="font-semibold">Selecione uma turma de destino para estes alunos</legend>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="deliberation-mode" checked={mode === "TRANSFER"} onChange={() => { setMode("TRANSFER"); setReviewing(false); }} />Encaminhar alunos para outra turma</label>
          {batchResult === "APPROVED" && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="deliberation-mode" disabled={!canGraduate} checked={mode === "GRADUATE"} onChange={() => { setMode("GRADUATE"); setReviewing(false); }} />Finalizar a turma por formatura</label>}
          {batchResult === "APPROVED" && !canGraduate && <p className="text-xs text-(--muted)">Para finalizar a turma por formatura, selecione todos os alunos para aprovação.</p>}
        </fieldset>
        {mode === "GRADUATE" ? <p className="text-sm leading-6">A turma será encerrada porque todos os alunos se formaram, sem vínculo com uma nova turma. Todos devem estar aprovados. Os cadastros dos alunos serão mantidos.</p> : <div className="space-y-4">
          <p className="text-sm text-(--muted)">Escolha turmas da mesma escola. Aprovados seguem para a próxima etapa; reprovados precisam de uma turma para cursar novamente.</p>
          {rooms.isPending && <p role="status">Carregando turmas…</p>}
          <ErrorMessage error={rooms.error} />
          {rooms.isError && <button className={actionClass} onClick={() => rooms.refetch()}>Tentar carregar turmas novamente</button>}
          {rooms.isSuccess && !destinations.length && <p className="text-sm">Nenhuma outra turma da mesma escola disponível para encaminhamento.</p>}
          <label className="block text-sm">Turma de destino<select className={fieldClass} value={targetRoom} disabled={!rooms.isSuccess} onChange={(event) => setTargetRoom(event.target.value)}><option value="">Selecione uma turma</option>{destinations.map((destination) => <option key={destination.id} value={destination.id}>{classroomLabel(destination)}</option>)}</select></label>
        </div>}
        <button type="button" className={actionClass} disabled={!canApply} onClick={apply}>Confirmar {batchResult === "APPROVED" ? "aprovação" : "reprovação"}</button>
        </div>
        </dialog>
        {ready && <button type="button" className={actionClass} onClick={() => setReviewing(true)}>Revisar deliberação</button>}
        {reviewing && ready && <section aria-label="Revisão da deliberação" className="space-y-4 border-t border-(--line) pt-5">
          <h3 className="font-semibold">Confira os resultados antes de confirmar</h3>
          <p className="text-sm">{roster.length} alunos · {graduating ? "Finalização por formatura" : "Encaminhamento para outras turmas"}. Todos os resultados serão aplicados em uma única operação.</p>
          <ul className="divide-y divide-(--line)">{roster.map((student) => <li key={student.id} className="py-2 text-sm">{student.fullName} · {results[student.id] === "APPROVED" ? "Aprovado" : "Reprovado"} · {graduating ? "Formatura" : classroomLabel(destinations.find((destination) => destination.id === studentDestinations[student.id]))}</li>)}</ul>
          <button type="button" className={actionClass} disabled={submit.isPending} onClick={() => { destinationDialog.current?.close(); setConfirming(true); }}>Enviar deliberação</button>
        </section>}
      </>}
      {confirming && <FeedbackModal
        type="invitation"
        title="Confirmar deliberação?"
        message={`${roster.length} alunos: ${approved} aprovados e ${failed} reprovados. ${graduating ? "A confirmação finalizará a turma por formatura." : "A confirmação encaminhará os alunos para as turmas escolhidas."} Os vínculos dos alunos serão alterados.`}
        actionLabel="Cancelar"
        disabled={submit.isPending}
        autoFocusAction
        onClose={() => setConfirming(false)}
        secondaryAction={{ label: submit.isPending ? "Enviando…" : "Confirmar deliberação", onClick: () => { if (ready && !submit.isPending) submit.mutate(payload); } }}
      />}
      {completed && <FeedbackModal type="success" title="Deliberação concluída" message="Os resultados foram registrados e os vínculos dos alunos foram atualizados." actionLabel="Voltar ao painel" onClose={() => router.replace("/coordinator")} />}
    </section>
  );
}
