# CodeCanvas

CodeCanvas is a calm, local-first browser coding workspace built with React, TypeScript, Vite and Monaco Editor.

## What works

- Story-led responsive homepage
- Local project dashboard
- Monaco code editing
- Multiple files and editor tabs
- Create, rename and delete file operations
- Debounced browser persistence and honest save states
- Real JavaScript execution in a disposable Web Worker
- Read-only sharing links and project forking
- Portable .canvas project export and import
- Installable offline shell backed by a service worker

CodeCanvas is positioned as a focused workspace for small programs and learners working with limited or unreliable connectivity. It is not yet a replacement for a VM-backed cloud development environment. Python, TypeScript and C++ execution require the planned server-side Judge0 integration and are not simulated.

## Development

```bash
pnpm install
pnpm dev
```

Build with `pnpm build`. See `IMPLEMENTATION_STATUS.md` for the verified scope and remaining infrastructure work.
