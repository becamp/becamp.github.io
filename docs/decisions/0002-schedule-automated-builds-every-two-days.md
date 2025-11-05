# Schedule Automated Builds Every Two Days

## Context and Problem Statement

The beCamp website uses full static site generation with content from ButterCMS and Airtable that is baked into the HTML at build time (see ADR-0001). Currently, builds only occur when code is pushed to the repository or pull requests are created. This means that if content is updated in the CMS without any code changes, the live site won't reflect those updates until someone manually triggers a rebuild or pushes new code.

For a static site with dynamic CMS content, we need a mechanism to periodically rebuild and redeploy the site to ensure content updates from ButterCMS and Airtable are reflected on the live site within a reasonable timeframe.

## Decision Drivers

- **Content Freshness**: Content managers need their CMS updates to appear on the live site within 48 hours without requiring developer intervention
- **Automated Workflow**: Non-technical content editors should not need to understand GitHub or trigger builds manually
- **Resource Efficiency**: Balance between content freshness and unnecessary builds that consume GitHub Actions minutes
- **Reliability**: Scheduled builds ensure content updates aren't forgotten or indefinitely delayed
- **Simplicity**: Use existing CI/CD infrastructure (GitHub Actions) without adding external services

## Considered Options

1. **Scheduled Builds Every Two Days** - Use GitHub Actions cron schedule to automatically rebuild every 48 hours
2. **CMS Webhook Integration** - Configure ButterCMS and Airtable webhooks to trigger builds on content changes
3. **Daily Builds** - More frequent automated rebuilds (every 24 hours)
4. **Manual Builds Only** - Continue requiring developers to manually trigger builds for content updates
5. **External Scheduling Service** - Use services like Zapier or Netlify to manage scheduled builds

## Decision Outcome

Chosen option: "Scheduled Builds Every Two Days", because it provides a good balance between content freshness and resource consumption while being simple to implement and maintain. This approach:

- Ensures content updates appear within 48 hours maximum
- Works entirely within GitHub's existing CI/CD infrastructure
- Requires no external services or additional API integrations
- Uses minimal GitHub Actions minutes (approximately 15 builds/month)
- Is predictable and easy to understand for the team

### Implementation Details

Update `.github/workflows/build.yml` to include a cron schedule trigger and manual dispatch option:

```yaml
on:
  push:
    branches: ["master"]
  pull_request:
    branches: ["master"]
  schedule:
    - cron: '0 0 */2 * *'  # Run at midnight UTC every 2 days
  workflow_dispatch:  # Allow manual triggering via GitHub UI
```

### Consequences

- Good, because content updates will be reflected on the live site automatically within 48 hours
- Good, because it requires no manual intervention from developers
- Good, because it uses existing infrastructure (GitHub Actions) with no additional costs or services
- Good, because the schedule is predictable and transparent (visible in the workflow file)
- Good, because scheduled runs will catch any transient build failures and retry
- Bad, because builds run even when no content has changed, consuming some unnecessary resources
- Bad, because there's still up to a 48-hour delay for urgent content updates (builds run on odd-numbered days)
- Bad, because the cron schedule might not align perfectly with content editor workflows
- Bad, because scheduled workflows automatically disable after 60 days of repository inactivity
- Neutral, because team members can still manually trigger builds via git push for urgent updates

### Confirmation

The implementation will be validated through:

1. **Workflow Configuration**: Verify the cron syntax is correct in `.github/workflows/build.yml`
2. **Initial Schedule Verification**: Confirm the first scheduled build runs successfully after implementation
3. **Build Logs**: Monitor GitHub Actions logs for scheduled builds over 2-3 cycles
4. **Content Update Test**: Update content in ButterCMS/Airtable and verify it appears after the next scheduled build
5. **Resource Usage**: Monitor GitHub Actions minutes to ensure resource consumption is acceptable

## Pros and Cons of the Options

### Scheduled Builds Every Two Days

Use GitHub Actions `schedule` trigger with cron syntax to automatically rebuild every 48 hours.

- Good, because it's extremely simple to implement (one configuration change)
- Good, because it uses only GitHub's built-in features with no external dependencies
- Good, because it's free within GitHub Actions free tier limits
- Good, because the schedule is version-controlled and transparent
- Good, because it's easy to adjust the frequency if needed
- Good, because it works reliably without requiring webhook setup or API keys
- Bad, because it runs builds even when content hasn't changed
- Bad, because there's still a delay (up to 48 hours) for content updates
- Bad, because it uses some GitHub Actions minutes unnecessarily
- Neutral, because scheduled workflows run in UTC time zone

### CMS Webhook Integration

Configure ButterCMS and Airtable to send webhooks to GitHub when content changes, triggering builds on-demand.

- Good, because builds only run when content actually changes
- Good, because content updates appear immediately (within minutes)
- Good, because it uses minimal resources (no unnecessary builds)
- Bad, because it requires webhook setup in multiple systems (ButterCMS and Airtable)
- Bad, because it adds complexity with webhook security and validation
- Bad, because it requires exposing an endpoint or using third-party services
- Bad, because GitHub Actions doesn't natively support webhook triggers (requires GitHub API or repository_dispatch)
- Bad, because it creates dependencies on external services being configured correctly
- Bad, because debugging webhook failures is more complex

### Daily Builds

More frequent automated rebuilds using `schedule` with `cron: '0 0 * * *'`.

- Good, because content updates appear faster (within 24 hours)
- Good, because it's as simple to implement as the two-day schedule
- Bad, because it uses twice as many GitHub Actions minutes
- Bad, because it doubles the number of unnecessary builds
- Bad, because daily builds are overkill for content that doesn't change frequently
- Neutral, because the implementation is identical, just with different frequency

### Manual Builds Only

Continue the current approach where builds only happen on code pushes.

- Good, because it uses the absolute minimum resources
- Good, because it's the simplest configuration (no changes needed)
- Bad, because content updates require developer intervention
- Bad, because it creates friction for content editors
- Bad, because content updates can be forgotten or delayed indefinitely
- Bad, because it doesn't scale with more frequent content updates

### External Scheduling Service

Use services like Zapier, GitHub webhooks, or Netlify build hooks to trigger builds on a schedule.

- Good, because it offers more flexibility in scheduling and conditions
- Good, because it can integrate with other automation workflows
- Bad, because it adds external dependencies and potential failure points
- Bad, because it may incur additional costs
- Bad, because it requires managing credentials and API access
- Bad, because it's more complex to set up and maintain
- Bad, because it's harder for team members to understand and modify

## More Information

### Implementation Steps

1. **Update GitHub Actions Workflow**:
   - Edit `.github/workflows/build.yml`
   - Add `schedule` trigger with cron expression: `0 0 */2 * *`
   - Commit and push changes to master branch

2. **Verify Configuration**:
   - Check GitHub Actions tab to confirm schedule is registered
   - Optionally trigger a manual workflow run to test the setup

3. **Monitor Initial Runs**:
   - Watch for the first scheduled build (will occur at midnight UTC on the scheduled day)
   - Verify build completes successfully
   - Check that deployed site reflects any recent CMS changes

4. **Document for Team**:
   - Update project documentation to explain the automated rebuild schedule
   - Document how to manually trigger builds for urgent updates

### Cron Schedule Explanation

The cron expression `0 0 */2 * *` means:
- `0` - At minute 0
- `0` - At hour 0 (midnight UTC)
- `*/2` - Every 2 days of the month (1st, 3rd, 5th, 7th, etc. - odd-numbered days)
- `*` - Every month
- `*` - Every day of the week

This results in builds running at midnight UTC on odd-numbered days of each month (approximately 15 times per month).

**Important GitHub Actions Limitations**:
- Scheduled workflows only run on the default branch (master)
- Scheduled workflows are automatically disabled if there's no repository activity for 60 days
- If disabled, they must be manually re-enabled in the GitHub Actions UI

### Manual Override

Team members can still manually trigger builds when needed:
- **Code Push**: Push any commit to the master branch
- **GitHub UI**: Use "Run workflow" button in GitHub Actions tab (enabled via workflow_dispatch trigger)

### Related Documentation

- [GitHub Actions Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Crontab Syntax](https://crontab.guru/#0_0_*/2_*_*)
- Current workflow: `.github/workflows/build.yml`

---

## AI-Specific Extensions

### AI Guidance Level

**Chosen level: Strict**

AI agents should implement exactly as specified - add the schedule trigger with the documented cron expression. This is a simple configuration change with well-defined requirements.

### AI Tool Preferences

- Preferred AI tools: Any agent capable of editing YAML files
- Special instructions:
  - Preserve all existing workflow configuration
  - Only add the `schedule` section to the `on` trigger list
  - Maintain proper YAML indentation
  - Do not modify any other parts of the workflow

### Test Expectations

Expected validation criteria:

- GitHub Actions recognizes the schedule (visible in Actions tab)
- Workflow syntax validation passes
- First scheduled run executes successfully at the expected time
- Scheduled runs appear in GitHub Actions history
- Build and deployment complete successfully for scheduled runs
- Content from ButterCMS and Airtable is properly fetched during scheduled builds

### Dependencies

**Related ADRs**:
- ADR-0001: Implement Full Static Site Generation for CMS Content (establishes the need for periodic rebuilds)

**System Components Affected**:
- `.github/workflows/build.yml:8-10` - GitHub Actions workflow configuration (schedule and workflow_dispatch triggers)

**External Dependencies**:
- GitHub Actions (for scheduled workflow execution)
- ButterCMS API (build-time dependency, unchanged)
- Airtable API (build-time dependency, unchanged)

### Timeline

- **Implementation deadline**: Immediate (single configuration change)
- **First review**: After 2-3 scheduled builds complete successfully
- **Revision triggers**:
  - Content update frequency increases (consider more frequent builds)
  - GitHub Actions minutes become a concern (consider webhooks or less frequent builds)
  - Content editors request faster update times (consider daily builds or webhooks)
  - Build time increases significantly (may need to optimize before increasing frequency)

### Risk Assessment

#### Technical Risks

- **Scheduled Workflow Doesn't Run**: GitHub's scheduled actions have known reliability issues
  - _Mitigation_: Monitor scheduled runs; GitHub typically resolves within a few minutes; manual runs always work as fallback

- **Build Failures Block Updates**: If scheduled builds fail, content updates won't appear
  - _Mitigation_: Set up GitHub Actions notifications for workflow failures; implement retries in workflow

- **Resource Exhaustion**: Too many builds could consume GitHub Actions free tier limits
  - _Mitigation_: Every-2-days schedule uses ~15 builds/month, well within free tier (2000 minutes/month); monitor usage

#### Business Risks

- **Content Update Expectations**: Content editors may expect faster updates than 48 hours
  - _Mitigation_: Clearly communicate the 48-hour maximum delay; document manual trigger process for urgent updates

- **Build Timing Misalignment**: Midnight UTC may not align with content editor schedules
  - _Mitigation_: Schedule can be adjusted if needed; current time minimizes impact on user traffic

### Human Review

- **Review required**: Before merging to master branch
- **Reviewers**: DevOps lead or project maintainer
- **Approval criteria**:
  - YAML syntax is correct
  - Cron expression matches intended schedule
  - No other workflow configuration is modified
  - Change is documented in this ADR

### Feedback Log

- **Implementation date**: 2025-11-04
- **Implementation notes**:
  - Successfully added schedule trigger to `.github/workflows/build.yml:8-9`
  - Added `workflow_dispatch` trigger to `.github/workflows/build.yml:10` to enable manual runs via GitHub UI
  - YAML syntax validated and matches ADR specification
  - Schedule will run on odd-numbered days of each month at midnight UTC (1st, 3rd, 5th, etc.)
  - No changes made to build or deployment processes - only added scheduling and manual trigger options
- **Actual outcomes**: [To be filled after monitoring 2-3 scheduled builds]
- **Challenges encountered**: [To be documented if any issues arise]
- **Lessons learned**: [To be documented after initial period]
- **Suggested improvements**:
  - Monitor if the bi-daily schedule meets content update expectations
  - Consider adding workflow inputs to workflow_dispatch for optional cache clearing or other build options
  - [Additional improvements to be added based on real-world usage]
