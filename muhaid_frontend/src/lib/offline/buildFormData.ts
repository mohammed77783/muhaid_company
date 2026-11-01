import type { OutboxRecord } from '../../types/web/inspections';

export function buildFormData(record: OutboxRecord): FormData {
  const form = new FormData();
  form.append('id', record.id);
  form.append('templateId', record.templateId);
  form.append('filledAt', record.filledAt);
  form.append('answers', JSON.stringify(record.answers)); // a JSON *string*
  form.append(
    'photo',
    record.photo,
    `photo.${record.photo.type.split('/')[1] ?? 'jpg'}`,
  );
  return form;
}
