# unsigned char

`unsigned char` is a small Tauri desktop app for local-first meeting
transcription. The target product is straightforward:

- capture microphone and system audio together
- keep transcription fully on-device
- use Qwen ASR as the speech-to-text engine

This repository starts as a thin desktop shell on purpose. The current baseline
focuses on product framing, a minimal session UI, and a small Rust-to-frontend
app blueprint so the next steps can stay native and incremental.

## Reference repo

Use `../char` as the nearby reference implementation when wiring the real audio
and transcription path. It is not a dependency of this project. It is the local
codebase to inspect for ideas around:

- audio capture and device handling
- offline transcription architecture
- meeting-oriented UX decisions

That connection is intentional and should stay visible as this repo grows.

## Planned architecture

1. Capture microphone and system audio in Rust.
2. Normalize or align the streams into a transcription-friendly format.
3. Feed local chunks into a Qwen ASR runtime.
4. Render a rolling transcript in the desktop UI.

## Development

```bash
npm install
npm run tauri dev
```

## Current status

The app currently provides:

- a renamed Tauri v2 desktop shell
- a focused `unsigned char` UI instead of the starter template
- a native `app_blueprint` command that describes the intended local pipeline

It does not yet capture audio or run inference.
