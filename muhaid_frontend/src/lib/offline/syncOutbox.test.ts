import { ApiError } from '../apiError';
import { outboxDb } from './outboxDb';
import { syncOutbox } from './syncOutbox';
import { inspectionsApi } from '../../api/web/inspectionsApi';
import type { OutboxRecord } from '../../types/web/inspections';

// The real modules read import.meta.env / build an HTTP client; the test only needs the seams.
jest.mock('../../api/web/inspectionsApi', () => ({
  inspectionsApi: { submit: jest.fn() },
  inspectionsKeys: {
    all: ['web', 'inspections'],
    detail: (id: string) => ['web', 'inspections', 'detail', id],
  },
}));
jest.mock('../queryClient', () => ({
  queryClient: { setQueryData: jest.fn(), invalidateQueries: jest.fn() },
}));
jest.mock('../authToken', () => ({ getToken: () => 'token' }));

const submit = inspectionsApi.submit as jest.Mock;

const record: OutboxRecord = {
  id: '3f0c2b9e-6d54-4b0e-9c1a-0a7d5e1b2c11',
  inspectorId: 'inspector-1',
  templateId: 'template-1',
  templateName: 'تفتيش',
  projectCode: 'P-1',
  itemsSnapshot: [],
  workOrderNumber: 'WO-1001',
  filledAt: '2026-11-01T08:00:00.000Z',
  answers: [{ itemId: 'item-1', answer: 'yes' }],
  photo: new Blob(['x'], { type: 'image/jpeg' }),
  status: 'pending',
  attempts: 0,
};

describe('syncOutbox', () => {
  beforeEach(async () => {
    submit.mockReset();
    await outboxDb.outbox.clear();
    await outboxDb.outbox.add(record);
  });

  it('keeps the form while offline, then sends it once with the same id when the network returns', async () => {
    // 1. Network is down: the request never reaches the server.
    submit.mockRejectedValueOnce(new ApiError(0, ['No connection to the server']));
    await syncOutbox(record.inspectorId);

    const kept = await outboxDb.outbox.get(record.id);
    expect(kept).toMatchObject({ status: 'pending', attempts: 1 });

    // 2. Network is back: the server accepts it.
    submit.mockResolvedValueOnce({ created: true, inspection: { id: record.id } });
    await syncOutbox(record.inspectorId);

    // 3. A further trigger (timer, "online" event) must not send it again.
    await syncOutbox(record.inspectorId);

    expect(submit).toHaveBeenCalledTimes(2); // one failed attempt + one success
    for (const [form] of submit.mock.calls as [FormData][]) {
      expect(form.get('id')).toBe(record.id); // same id on retry => server dedupes
    }
    expect(await outboxDb.outbox.count()).toBe(0);
  });
});
