/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { extractIp } from '@/lib/utils/http';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/test', { headers });
}

describe('extractIp', () => {
  it('returns the first IP from x-forwarded-for when valid IPv4', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    expect(extractIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '5.6.7.8' });
    expect(extractIp(req)).toBe('5.6.7.8');
  });

  it('returns unknown when no IP headers present', () => {
    const req = makeRequest();
    expect(extractIp(req)).toBe('unknown');
  });

  it('rejects malformed x-forwarded-for and falls back to x-real-ip', () => {
    const req = makeRequest({
      'x-forwarded-for': 'not-an-ip',
      'x-real-ip': '9.9.9.9',
    });
    expect(extractIp(req)).toBe('9.9.9.9');
  });

  it('returns unknown when both headers are malformed', () => {
    const req = makeRequest({
      'x-forwarded-for': 'evil; DROP TABLE',
      'x-real-ip': 'also-bad',
    });
    expect(extractIp(req)).toBe('unknown');
  });

  it('accepts a valid IPv6 address', () => {
    const req = makeRequest({ 'x-forwarded-for': '2001:db8::1' });
    expect(extractIp(req)).toBe('2001:db8::1');
  });

  it('rejects protocol-relative injection attempt in forwarded header', () => {
    const req = makeRequest({ 'x-forwarded-for': '//evil.example' });
    expect(extractIp(req)).toBe('unknown');
  });

  it('rejects malformed IPv6 with triple colon', () => {
    const req = makeRequest({ 'x-forwarded-for': '2001:::1' });
    expect(extractIp(req)).toBe('unknown');
  });

  it('rejects single colon as IPv6', () => {
    const req = makeRequest({ 'x-forwarded-for': ':' });
    expect(extractIp(req)).toBe('unknown');
  });

  it('rejects multiple double-colon compressions', () => {
    const req = makeRequest({ 'x-forwarded-for': '2001::db8::1' });
    expect(extractIp(req)).toBe('unknown');
  });

  it('rejects IPv6 with more than 8 segments', () => {
    const req = makeRequest({ 'x-forwarded-for': '1:2:3:4:5:6:7:8:9' });
    expect(extractIp(req)).toBe('unknown');
  });
});
