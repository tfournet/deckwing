import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockReadFile = vi.fn().mockResolvedValue('{}');
const mockWriteFile = vi.fn().mockResolvedValue(undefined);

vi.mock('fs', () => ({
  promises: {
    mkdir: (...args) => mockMkdir(...args),
    readFile: (...args) => mockReadFile(...args),
    writeFile: (...args) => mockWriteFile(...args),
  },
}));

import { writeClaudeCredentials } from './claude-oauth.js';

describe('writeClaudeCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('{}');
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('creates config directory with mode 0o700', async () => {
    await writeClaudeCredentials({
      access_token: 'tok_test',
      refresh_token: 'ref_test',
      expires_in: 3600,
      scope: 'user:inference',
    });

    expect(mockMkdir).toHaveBeenCalledTimes(1);
    expect(mockMkdir).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recursive: true, mode: 0o700 })
    );
  });

  it('writes credentials file with mode 0o600', async () => {
    await writeClaudeCredentials({
      access_token: 'tok_test',
      refresh_token: 'ref_test',
      expires_in: 3600,
      scope: 'user:inference',
    });

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ encoding: 'utf8', mode: 0o600 })
    );
  });

  it('writes valid JSON with claudeAiOauth structure', async () => {
    await writeClaudeCredentials({
      access_token: 'tok_test',
      refresh_token: 'ref_test',
      expires_in: 3600,
      scope: 'user:inference',
    });

    const writtenJson = JSON.parse(mockWriteFile.mock.calls[0][1]);
    expect(writtenJson.claudeAiOauth).toBeDefined();
    expect(writtenJson.claudeAiOauth.accessToken).toBe('tok_test');
    expect(writtenJson.claudeAiOauth.refreshToken).toBe('ref_test');
    expect(writtenJson.claudeAiOauth.scopes).toEqual(['user:inference']);
  });
});
