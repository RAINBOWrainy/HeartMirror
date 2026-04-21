# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

This project uses **Vitest** for testing, with:
- `@testing-library/react` for React component testing
- `jsdom` for browser environment simulation
- `playwright` for end-to-end testing

## How to run tests

```bash
# Run all tests
npx vitest run

# Run specific test file
npx vitest run path/to/test.file.test.ts

# Watch mode for development
npx vitest dev
```

## Test layers

- **Unit tests**: Test pure functions and utility modules in isolation (encryption, validation, etc.)
- **Component tests**: Test individual React components in isolation
- **Integration tests**: Test API routes and complete workflows
- **E2E tests**: Full end-to-end browser testing with playwright

## Conventions

- Test files live in `test/` directory, mirroring the source structure
- File naming: `test/{path/to/module}.test.ts`
- One `describe` block per module, nested `describe` for each function/method
- One `it` per test case
- Test what the code **does**, not what it **is**: `expect(decrypted).toBe(plaintext)` not `expect(key).toBeDefined()`
- When fixing a bug found by QA, always add a regression test that reproduces the bug and verifies the fix

## Expectations

- When adding new functions, write a corresponding test
- When fixing a bug, write a regression test
- When adding an if/else condition, write tests for **both** paths
- Never commit code that makes existing tests fail
