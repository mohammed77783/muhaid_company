import type { AnswerValue, TemplateItem } from '../../types/api';

export interface DraftAnswer {
  answer: AnswerValue | null;
  note: string;
}

export interface DraftValues {
  answers: Record<string, DraftAnswer>;
  photo: Blob | null;
}

export interface DraftProblems {
  photo?: 'required';
  /** By item id. */
  items: Record<string, 'unanswered' | 'noteRequired' | 'noteTooLong'>;
}

const MAX_NOTE = 1000;

/** Mirrors the server's rules, so most rejections never happen. The server still decides. */
export function validateDraft(
  draft: DraftValues,
  items: TemplateItem[],
): DraftProblems {
  const problems: DraftProblems = { items: {} };
  if (!draft.photo) problems.photo = 'required';

  for (const item of items) {
    const entry = draft.answers[item.id];
    const note = entry?.note.trim() ?? '';
    if (!entry?.answer) problems.items[item.id] = 'unanswered';
    else if (entry.answer === 'no' && !note) {
      problems.items[item.id] = 'noteRequired';
    } else if (note.length > MAX_NOTE) problems.items[item.id] = 'noteTooLong';
  }
  return problems;
}

export function hasProblems(problems: DraftProblems): boolean {
  return Boolean(problems.photo || Object.keys(problems.items).length > 0);
}
