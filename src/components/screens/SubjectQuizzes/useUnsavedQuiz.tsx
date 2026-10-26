"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";

export function useUnsavedQuiz(dirty: boolean, pending: boolean) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const exit = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);

  function requestExit(action: () => void) {
    if (pending) return;
    if (!dirty) {
      action();
      return;
    }
    exit.current = action;
    setOpen(true);
  }

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function beforeBack(event: Event) {
      event.preventDefault();
      if (pending) return;
      exit.current = () => router.back();
      setOpen(true);
    }
    function click(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.href === window.location.href ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (pending) return;
      exit.current = () => {
        if (url.origin === window.location.origin)
          router.push(url.pathname + url.search + url.hash);
        else window.location.assign(url.href);
      };
      setOpen(true);
    }
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pulso:before-back", beforeBack);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pulso:before-back", beforeBack);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, pending, router]);

  function stay() {
    exit.current = null;
    setOpen(false);
  }

  return {
    requestExit,
    confirmation: (
      <dialog
        ref={dialog}
        aria-labelledby="discard-quiz-title"
        onCancel={(event) => {
          event.preventDefault();
          stay();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(calc(100vw-40px),528px)] overflow-y-auto rounded-[20px] bg-transparent p-0 backdrop:bg-black/70"
      >
        <FeedbackModalContent
          type="error"
          titleId="discard-quiz-title"
          title="Sair da criação do quiz?"
          message="O que você preencheu será perdido. Deseja sair ou continuar editando?"
          actionLabel="Continuar editando"
          autoFocusAction
          onClose={stay}
          secondaryAction={{
            label: "Sair e descartar",
            onClick: () => {
              const action = exit.current;
              exit.current = null;
              dialog.current?.close();
              setOpen(false);
              action?.();
            },
          }}
        />
      </dialog>
    ),
  };
}
