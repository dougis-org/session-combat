---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-otel-telemetry` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] (Task 5, Spec: Emit OpenTelemetry counter) Test that `opCounter.add` is called exactly once with `{ name, collection, outcome }` during a successful storage event.
- [ ] (Task 5, Spec: Emit OpenTelemetry counter) Test that `opCounter.add` is called exactly once with `{ name, collection, outcome: "error" }` during an error storage event.
- [ ] (Task 5, Spec: Emit OpenTelemetry trace span) Test that a span is created with the name `storage.<collection>.<name>`.
- [ ] (Task 5, Spec: Emit OpenTelemetry trace span) Test that `tracer.startSpan` is provided a `startTime` equal to `endTime - durationMs`.
- [ ] (Task 5, Spec: Emit OpenTelemetry trace span) Test that `span.end()` is called with `endTime`.
- [ ] (Task 5, Spec: Recording exceptions) Test that `span.recordException` and `span.setStatus` are called when the outcome is `error` and an `Error` object is provided.
- [ ] (Task 5, Spec: Console logging fallback) Test that `console.log` is called when `process.env.NODE_ENV = 'development'` for a success event.
- [ ] (Task 5, Spec: Console logging fallback) Test that `console.error` is called when `process.env.NODE_ENV = 'development'` for an error event.
- [ ] (Task 5, Spec: Console logging fallback) Test that NO console methods are called when `process.env.NODE_ENV = 'production'`.
- [ ] (Task 5, Spec: Missing OTel SDK) Test that calling the function without any mocked OTel APIs does not throw an error (relies on API defaults).
