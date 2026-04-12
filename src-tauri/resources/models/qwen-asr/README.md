Bundled ASR model files are no longer used by the app.

The live transcription engine now uses `speech-swift`, which downloads and caches
its CoreML model files under the current user's cache directory on first setup.

This placeholder directory stays in git so existing bundle resource wiring does
not break while the old bundled-model path is retired.
