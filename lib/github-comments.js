module.exports = async function manageCiComments({
  github,
  context,
  core,
  needs,
}) {
  if (context.eventName !== 'pull_request') {
    core.info('Not a pull request event. Skipping PR comment management.');
    return;
  }

  const prNumber = context.payload.pull_request.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const marker = '<!-- session-combat-build-test-failure -->';

  try {
    const failedJobs = [];
    for (const [jobId, job] of Object.entries(needs)) {
      if (job && (job.result === 'failure' || job.result === 'cancelled')) {
        failedJobs.push(jobId);
      }
    }

    let existingComment;
    for (let page = 1; !existingComment; page++) {
      const { data: comments } = await github.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
        per_page: 100,
        page,
      });

      existingComment = comments.find(c => c.body && c.body.replace(/\r\n/g, '\n').includes(marker));

      if (comments.length < 100) break;
    }

    if (failedJobs.length === 0) {
      if (existingComment) {
        core.info(`Deleting existing failure comment with ID: ${existingComment.id}`);
        await github.rest.issues.deleteComment({
          owner,
          repo,
          comment_id: existingComment.id,
        });
      } else {
        core.info('No existing failure comment found to delete.');
      }
      return;
    }

    // Failure case
    const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
    const failedJobsList = failedJobs.map(job => `- **${job}**`).join('\n');
    const newDetails = `### Run #${context.runNumber} Failed ❌\n**Failed Jobs:**\n${failedJobsList}\n\n[View Workflow Run](${runUrl})`;

    const prefix = `${marker}\n## Build & Test Workflow Failures\n\n`;

    if (existingComment) {
      let oldDetails = '';
      const normalizedBody = existingComment.body.replace(/\r\n/g, '\n');
      if (normalizedBody.includes(prefix)) {
        oldDetails = normalizedBody.split(prefix)[1] || '';
      } else {
        oldDetails = normalizedBody.replace(marker, '').trim();
      }
      const updatedBody = `${prefix}${newDetails}${oldDetails ? '\n\n---\n\n' + oldDetails : ''}`;
      core.info(`Updating existing failure comment with ID: ${existingComment.id}`);
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: updatedBody,
      });
    } else {
      const body = `${prefix}${newDetails}`;
      core.info('Creating new failure comment.');
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.warning(`Error running PR comment management: ${message}`);
  }
};
