# unsigned char

`unsigned char` is a simple desktop app for transcribing meetings on your own
machine.

It is meant to:

- listen to your microphone and system audio at the same time
- transcribe the conversation locally
- use Qwen ASR for speech recognition
- use pyannoteAI for speaker diarization when diarization is enabled

## Views

The app has three views:

1. Onboarding: grant microphone and system audio access.
2. Home: browse saved meetings and create a new one.
3. Meeting: read the live transcript for the current meeting.

## How to use

1. Open the app.
2. Finish the permission onboarding.
3. Go to Home.
4. Use the floating action button to create a meeting.
5. Watch the transcript in the Meeting view.
6. Save the meeting as a Markdown file when you need it.

## Current status

This repo is still at the starting point. The app structure is in place, but
the actual audio capture and transcription flow are not wired yet.

The app now stores model selection and resolves the default Qwen ASR path from
bundled Tauri resources. The runtime still needs to consume that selection when
real transcription is wired in.

Speaker diarization is now configured separately through pyannoteAI, but the
runtime still needs to upload audio and reconcile diarization results with the
transcript when that pipeline is implemented.

## Model setup

Bundled builds look for the default model under:

```text
src-tauri/resources/models/qwen-asr/
```

That directory is copied into the packaged app bundle automatically.

Users can also switch to a custom Hugging Face model from the Settings window by
providing:

- a repo ID or Hugging Face URL
- an optional revision
- a local snapshot path on disk

Open Settings from the menu bar or use `Cmd+,` on macOS and `Ctrl+,` on other
platforms.

## Speaker diarization setup

Speaker diarization uses [pyannoteAI](https://docs.pyannote.ai/introduction).
Per the pyannoteAI docs, the hosted API needs an API key and processes uploaded
audio or publicly accessible file URLs.

From the Settings window you can:

- enable or disable speaker diarization
- choose `precision-2` or `community-1`
- use a saved API key or `PYANNOTE_API_KEY` from your environment

## Run it

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the desktop app:

   ```bash
   npm run tauri dev
   ```

3. When the app opens, finish the permission onboarding before using the rest of
   the app.

## Note for development

Shout out to [fastrepl/char](https://github.com/fastrepl/char). It already
covers more of the meeting-transcription problem and is a good place to borrow
ideas from while building this out.
