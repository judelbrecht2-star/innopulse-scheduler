"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";

import type { PublicQuestion } from "@/components/booking/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AnswerValue = string | string[] | boolean | number;

interface IntakeFormProps {
  questions: PublicQuestion[];
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (details: {
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    answers: Array<{ questionId: string; value: AnswerValue }>;
  }) => void;
}

export function IntakeForm({ questions, submitting, error, onBack, onSubmit }: IntakeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const answers = questions.map((question) => {
      let value: AnswerValue;
      if (question.type === "MULTI_SELECT") value = form.getAll(`question-${question.id}`).map(String);
      else if (question.type === "CHECKBOX") value = form.get(`question-${question.id}`) === "true";
      else if (question.type === "NUMBER") value = Number(form.get(`question-${question.id}`));
      else value = String(form.get(`question-${question.id}`) ?? "");
      return { questionId: question.id, value };
    });

    onSubmit({
      inviteeName: String(form.get("inviteeName") ?? ""),
      inviteeEmail: String(form.get("inviteeEmail") ?? ""),
      inviteePhone: String(form.get("inviteePhone") ?? "") || undefined,
      answers,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl text-white">
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm text-white/45 hover:text-primary">
        <ArrowLeft className="size-4" /> Choose another time
      </button>
      <h2 className="text-2xl">Your details</h2>
      <p className="mt-2 text-sm text-white/45">We’ll use these details for the confirmation email and calendar invitation.</p>

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-medium">
          Name <span className="text-destructive">*</span>
          <Input name="inviteeName" autoComplete="name" required className="mt-2" />
        </label>
        <label className="block text-sm font-medium">
          Email <span className="text-destructive">*</span>
          <Input name="inviteeEmail" type="email" autoComplete="email" required className="mt-2" />
        </label>
        <label className="block text-sm font-medium">
          Phone number
          <Input name="inviteePhone" type="tel" autoComplete="tel" className="mt-2" />
        </label>

        {questions.map((question) => (
          <QuestionField key={question.id} question={question} />
        ))}
      </div>

      {error && <p className="mt-5 rounded-button bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      <p className="mt-6 flex items-start gap-2 rounded-button border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/45"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />We’ll check this time against the host’s live calendar once more before confirming.</p>
      <Button type="submit" className="mt-7 w-full" disabled={submitting}>
        {submitting && <LoaderCircle className="size-4 animate-spin" />}
        {submitting ? "Checking availability…" : "Check availability & book"}
      </Button>
    </form>
  );
}

function QuestionField({ question }: { question: PublicQuestion }) {
  const name = `question-${question.id}`;
  const label = (
    <>
      {question.label} {question.required && <span className="text-destructive">*</span>}
    </>
  );

  if (question.type === "LONG_TEXT") {
    return (
      <label className="block text-sm font-medium">
        {label}
        <textarea name={name} required={question.required} placeholder={question.placeholder ?? undefined} className="ip-input mt-2 min-h-28 resize-y" />
      </label>
    );
  }

  if (question.type === "SINGLE_SELECT" || question.type === "MULTI_SELECT") {
    return (
      <label className="block text-sm font-medium">
        {label}
        <select name={name} required={question.required} multiple={question.type === "MULTI_SELECT"} className="ip-input mt-2">
          {question.type === "SINGLE_SELECT" && <option value="">Select an option</option>}
          {question.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (question.type === "CHECKBOX") {
    return (
      <label className="flex items-start gap-3 rounded-button border border-white/10 bg-white/5 p-4 text-sm">
        <input type="checkbox" name={name} value="true" required={question.required} className="mt-0.5 size-4 accent-brand-navy" />
        <span>{label}</span>
      </label>
    );
  }

  const inputType = question.type === "EMAIL" ? "email" : question.type === "PHONE" ? "tel" : question.type === "NUMBER" ? "number" : "text";
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input name={name} type={inputType} required={question.required} placeholder={question.placeholder ?? undefined} className="mt-2" />
      {question.helpText && <span className="mt-1 block text-xs font-normal text-white/45">{question.helpText}</span>}
    </label>
  );
}
