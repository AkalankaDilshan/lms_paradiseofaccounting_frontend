import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { describeError } from '../errors';

function httpError(status: number, error?: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, {
    status, statusText: '', headers: {}, config, data: error ? { error } : {},
  });
}

describe('describeError', () => {
  it('shows the backend message for a conflict', () => {
    const d = describeError(httpError(409, 'An account with this email already exists'));
    expect(d).toMatchObject({ severity: 'warning', message: 'An account with this email already exists' });
  });

  it('treats an expired session as critical with sign-in', () => {
    expect(describeError(httpError(401))).toMatchObject({ severity: 'critical', sessionExpired: true });
  });

  it('treats a suspended account as critical', () => {
    const d = describeError(httpError(403, 'Your account is suspended. Please contact the class office.'));
    expect(d).toMatchObject({ severity: 'critical', title: 'Account suspended' });
  });

  it('treats other permission errors as errors', () => {
    expect(describeError(httpError(403, 'Requires SuperAdmin role')).severity).toBe('error');
  });

  it('treats server failures as critical', () => {
    expect(describeError(httpError(502)).severity).toBe('critical');
  });

  it('treats validation errors as warnings with the server text', () => {
    expect(describeError(httpError(400, 'openAt must be before closeAt'))).toMatchObject({ severity: 'warning', message: 'openAt must be before closeAt' });
  });

  it('recognises a network failure', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() });
    expect(describeError(err).severity).toBe('warning');
  });

  it('falls back for non-HTTP errors', () => {
    expect(describeError(new Error('boom'), 'Couldn’t save')).toMatchObject({ severity: 'error', title: 'Couldn’t save', message: 'boom' });
  });
});
