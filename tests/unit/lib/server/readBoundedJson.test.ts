/**
 * @jest-environment node
 */
import { readBoundedJson } from '@/lib/server/readBoundedJson';
import { NextRequest } from 'next/server';

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers,
    body,
  });
}

describe('readBoundedJson', () => {
  it('T2.1 body under cap → { ok: true, value }', async () => {
    const payload = { foo: 'bar' };
    const request = makeRequest(JSON.stringify(payload));
    const result = await readBoundedJson(request, 1024);
    expect(result).toEqual({ ok: true, value: payload });
  });

  it('T2.2 body over cap → { ok: false, reason: "oversize" } and reader.cancel() called', async () => {
    const bigText = JSON.stringify({ x: 'y'.repeat(2000) });
    const request = makeRequest(bigText);

    const realReader = request.body!.getReader();
    const cancelSpy = jest.spyOn(realReader, 'cancel');
    jest.spyOn(request, 'body', 'get').mockReturnValue({
      getReader: () => realReader,
    } as unknown as NextRequest['body']);

    const result = await readBoundedJson(request, 16);
    expect(result).toEqual({ ok: false, reason: 'oversize' });
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('T2.3 oversized Content-Length header → oversize without reading the stream', async () => {
    const request = makeRequest(JSON.stringify({ a: 1 }), { 'content-length': '99999' });
    const getReaderSpy = jest.spyOn(request.body!, 'getReader');

    const result = await readBoundedJson(request, 16);
    expect(result).toEqual({ ok: false, reason: 'oversize' });
    expect(getReaderSpy).not.toHaveBeenCalled();
  });

  it('T2.4 invalid JSON under cap → { ok: false, reason: "invalid-json" }', async () => {
    const request = makeRequest('not json {{{');
    const result = await readBoundedJson(request, 1024);
    expect(result).toEqual({ ok: false, reason: 'invalid-json' });
  });

  it('T2.5 missing body stream → { ok: false, reason: "error" }', async () => {
    const request = makeRequest(JSON.stringify({ a: 1 }));
    jest.spyOn(request, 'body', 'get').mockReturnValue(null);
    const result = await readBoundedJson(request, 1024);
    expect(result).toEqual({ ok: false, reason: 'error' });
  });
});
