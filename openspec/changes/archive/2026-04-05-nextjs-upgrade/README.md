# Change: NextJS 16.2.2 Upgrade

## Quick Summary

**Issue**: #120  
**Status**: Proposal complete  
**Type**: Dependency update (patch version)  
**Scope**: Update `next` and `eslint-config-next` from 16.1.6 to 16.2.2

## Files in This Change

```
openspec/changes/2026-04-05-nextjs-upgrade/
├── proposal.md          # Why, scope, acceptance criteria, risks
├── design.md            # Implementation decisions, mapping, rollback
├── tasks.md             # Detailed 16-step execution plan
├── specs/
│   └── framework-runtime/
│       └── spec.md      # Acceptance criteria and test scenarios
└── README.md            # This file
```

## Workflow (SDD)

1. **Proposal** (this phase - complete)
   - Problem space defined
   - Acceptance criteria established
   - Risks identified and mitigated
   - **Awaiting approval**: Have a human review proposal.md before proceeding to design

2. **Design** (ready)
   - Implementation decisions documented
   - Rollback strategy defined
   - Testing strategy outlined

3. **Specs** (ready)
   - Acceptance scenarios (Given/When/Then format)
   - Test commands and expected results

4. **Tasks** (ready for execution)
   - Step-by-step instructions for implementation
   - Covers: preparation → validation → CI/CD → deployment → archive
   - 16 sections, ~100 checklist items for traceability

5. **Apply** (pending task execution)
   - Follow tasks.md to implement the upgrade
   - Push to feature branch → PR → CI validation → merge → deploy → archive

## Key Acceptance Criteria

✅ All unit tests pass  
✅ All integration tests pass  
✅ All E2E regression tests pass  
✅ ESLint validation passes  
✅ Local build succeeds  
✅ Docker build succeeds  
✅ GitHub Actions build-test.yml passes  
✅ GitHub Actions deploy.yml passes  
✅ Fly.io deployment succeeds  
✅ Live app verified operational  

## Risk Assessment

**Risk Level**: LOW

- Patch version bump (no breaking changes)
- No configuration changes needed
- Comprehensive test coverage
- Automated CI/CD pipeline
- Clear rollback path

## Next Steps

### For Approval
1. Review `proposal.md` for scope, risks, and acceptance criteria
2. Review `design.md` for implementation decisions
3. Approve or request changes
4. Once approved: proceed to execution

### For Execution
1. Follow `tasks.md` (16 sections, each with explicit checklist items)
2. Execute in order: Preparation → Validation → CI/CD → Deployment → Archive
3. Monitor GitHub Actions and Fly.io throughout
4. Verify live app after deployment

## Related Issues

- GitHub Issue #120: "Update NextJS to latest version"
- Security vulnerabilities mentioned but not detailed (verify with `npm audit`)

## Archive Location

After merge:
```
openspec/changes/archive/2026-04-05-nextjs-upgrade/
```

---

**Proposal created**: 2026-04-05  
**Change name**: `2026-04-05-nextjs-upgrade`  
**Status**: Ready for approval and execution
