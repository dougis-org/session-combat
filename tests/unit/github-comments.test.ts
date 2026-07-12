import manageCiComments from '../../lib/github-comments.js';

describe('manageCiComments', () => {
  let mockGithub: any;
  let mockContext: any;
  let mockCore: any;

  beforeEach(() => {
    mockGithub = {
      rest: {
        issues: {
          listComments: jest.fn(),
          createComment: jest.fn(),
          updateComment: jest.fn(),
          deleteComment: jest.fn(),
        },
      },
    };

    mockContext = {
      eventName: 'pull_request',
      runId: '12345',
      runNumber: 42,
      repo: {
        owner: 'dougis-org',
        repo: 'session-combat',
      },
      payload: {
        pull_request: {
          number: 100,
        },
      },
    };

    mockCore = {
      info: jest.fn(),
      warning: jest.fn(),
    };
  });

  it('should skip if not a pull request event', async () => {
    mockContext.eventName = 'push';
    await manageCiComments({
      github: mockGithub,
      context: mockContext,
      core: mockCore,
      needs: {},
    });
    expect(mockCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Not a pull request event')
    );
    expect(mockGithub.rest.issues.listComments).not.toHaveBeenCalled();
  });

  it('should post new comment on first failure', async () => {
    mockGithub.rest.issues.listComments.mockResolvedValue({ data: [] });
    const needs = {
      build: { result: 'failure' },
      lint: { result: 'success' },
    };

    await manageCiComments({
      github: mockGithub,
      context: mockContext,
      core: mockCore,
      needs,
    });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'dougis-org',
      repo: 'session-combat',
      issue_number: 100,
      body: expect.stringContaining('Run #42 Failed'),
    });
    expect(mockGithub.rest.issues.createComment.mock.calls[0][0].body).toContain(
      '<!-- session-combat-build-test-failure -->'
    );
  });

  it('should post new comment when a job is cancelled', async () => {
    mockGithub.rest.issues.listComments.mockResolvedValue({ data: [] });
    const needs = {
      build: { result: 'cancelled' },
      lint: { result: 'success' },
    };

    await manageCiComments({
      github: mockGithub,
      context: mockContext,
      core: mockCore,
      needs,
    });

    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'dougis-org',
      repo: 'session-combat',
      issue_number: 100,
      body: expect.stringContaining('build'),
    });
  });

  it('should update existing comment on subsequent failure', async () => {
    const marker = '<!-- session-combat-build-test-failure -->';
    const priorComment = {
      id: 999,
      body: `${marker}\n## Build & Test Workflow Failures\n\n### Run #41 Failed ❌\n**Failed Jobs:**\n- **lint**\n\n[View Workflow Run](https://github.com/dougis-org/session-combat/actions/runs/111)`,
    };
    mockGithub.rest.issues.listComments.mockResolvedValue({ data: [priorComment] });

    const needs = {
      build: { result: 'failure' },
    };

    await manageCiComments({
      github: mockGithub,
      context: mockContext,
      core: mockCore,
      needs,
    });

    expect(mockGithub.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: 'dougis-org',
      repo: 'session-combat',
      comment_id: 999,
      body: expect.stringContaining('Run #42 Failed'),
    });
    const bodyArg = mockGithub.rest.issues.updateComment.mock.calls[0][0].body;
    expect(bodyArg).toContain('Run #42 Failed');
    expect(bodyArg).toContain('Run #41 Failed');
    expect(bodyArg).toContain('---');
  });

  it('should delete comment on recovery/success', async () => {
    const marker = '<!-- session-combat-build-test-failure -->';
    const priorComment = {
      id: 999,
      body: `${marker}\n## Build & Test Workflow Failures\n\n### Run #41 Failed ❌`,
    };
    mockGithub.rest.issues.listComments.mockResolvedValue({ data: [priorComment] });

    const needs = {
      build: { result: 'success' },
    };

    await manageCiComments({
      github: mockGithub,
      context: mockContext,
      core: mockCore,
      needs,
    });

    expect(mockGithub.rest.issues.deleteComment).toHaveBeenCalledWith({
      owner: 'dougis-org',
      repo: 'session-combat',
      comment_id: 999,
    });
  });

  it('should handle API errors gracefully (fork PRs)', async () => {
    mockGithub.rest.issues.listComments.mockRejectedValue(new Error('Resource not accessible'));
    const needs = {
      build: { result: 'failure' },
    };

    await expect(
      manageCiComments({
        github: mockGithub,
        context: mockContext,
        core: mockCore,
        needs,
      })
    ).resolves.not.toThrow();

    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining('Error running PR comment management: Resource not accessible')
    );
  });
});
