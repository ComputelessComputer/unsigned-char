import AudioCommon
import AVFoundation
import Foundation
import ParakeetStreamingASR
import SwiftRs

private struct ModelDownloadPayload: Codable {
  var status: String
  var currentFile: String?
  var localPath: String
  var error: String?
}

private struct TranscriptionPayload: Codable {
  var running: Bool
  var text: String
  var error: String?

  static let empty = TranscriptionPayload(running: false, text: "", error: nil)
}

private func encodeJSON<T: Encodable>(_ value: T) -> String {
  guard let data = try? JSONEncoder().encode(value),
        let string = String(data: data, encoding: .utf8)
  else {
    return "{}"
  }

  return string
}

private func waitForValue<T>(_ operation: @escaping () async -> T) -> T {
  let semaphore = DispatchSemaphore(value: 0)
  var result: T!

  Task {
    result = await operation()
    semaphore.signal()
  }

  semaphore.wait()
  return result
}

private final class LiveTranscriptionSession {
  private let audioIO = AudioIO()
  private let streamingSession: StreamingSession
  private let stateLock = NSLock()
  private let bufferLock = NSLock()
  private let processingQueue = DispatchQueue(
    label: "com.johnjeong.unsigned.speech-swift.processing",
    qos: .userInitiated
  )

  private var processingTimer: DispatchSourceTimer?
  private var bufferedSamples: [Float] = []
  private var finalSegments: [String] = []
  private var partialText = ""
  private var running = false
  private var errorMessage: String?

  init(model: ParakeetStreamingASRModel) throws {
    streamingSession = try model.createSession()
  }

  func start() throws {
    try audioIO.startMicrophone(targetSampleRate: 16000) { [weak self] samples in
      self?.append(samples)
    }

    let timer = DispatchSource.makeTimerSource(queue: processingQueue)
    timer.schedule(deadline: .now(), repeating: .milliseconds(250))
    timer.setEventHandler { [weak self] in
      self?.processBufferedSamples()
    }
    timer.resume()

    stateLock.lock()
    running = true
    errorMessage = nil
    stateLock.unlock()
    processingTimer = timer
  }

  func snapshot() -> TranscriptionPayload {
    stateLock.lock()
    defer { stateLock.unlock() }

    return TranscriptionPayload(
      running: running,
      text: transcriptText(),
      error: errorMessage
    )
  }

  func stop() {
    stateLock.lock()
    let wasRunning = running
    running = false
    stateLock.unlock()

    audioIO.stopMicrophone()

    let timer = processingTimer
    processingTimer = nil
    timer?.cancel()

    guard wasRunning || hasBufferedSamples else {
      return
    }

    processingQueue.sync {
      processBufferedSamples()
      finalizeSession()
    }
  }

  private var hasBufferedSamples: Bool {
    bufferLock.lock()
    defer { bufferLock.unlock() }
    return !bufferedSamples.isEmpty
  }

  private func append(_ samples: [Float]) {
    guard !samples.isEmpty else {
      return
    }

    bufferLock.lock()
    bufferedSamples.append(contentsOf: samples)
    bufferLock.unlock()
  }

  private func takeBufferedSamples() -> [Float] {
    bufferLock.lock()
    defer { bufferLock.unlock() }

    let samples = bufferedSamples
    bufferedSamples.removeAll(keepingCapacity: true)
    return samples
  }

  private func processBufferedSamples() {
    let samples = takeBufferedSamples()
    guard !samples.isEmpty else {
      return
    }

    do {
      apply(try streamingSession.pushAudio(samples))
    } catch {
      fail("speech-swift failed while processing microphone audio: \(error.localizedDescription)")
    }
  }

  private func finalizeSession() {
    do {
      apply(try streamingSession.finalize())

      stateLock.lock()
      partialText = ""
      stateLock.unlock()
    } catch {
      fail("speech-swift failed while finalizing audio: \(error.localizedDescription)")
    }
  }

  private func apply(_ partials: [ParakeetStreamingASRModel.PartialTranscript]) {
    guard !partials.isEmpty else {
      return
    }

    stateLock.lock()
    defer { stateLock.unlock() }

    for partial in partials {
      let text = partial.text.trimmingCharacters(in: .whitespacesAndNewlines)

      if partial.isFinal {
        if !text.isEmpty {
          finalSegments.append(text)
        }
        partialText = ""
        continue
      }

      partialText = text
    }
  }

  private func fail(_ message: String) {
    stateLock.lock()
    errorMessage = message
    running = false
    stateLock.unlock()

    audioIO.stopMicrophone()

    let timer = processingTimer
    processingTimer = nil
    timer?.cancel()
  }

  private func transcriptText() -> String {
    let finalText = finalSegments.joined(separator: "\n")

    if finalText.isEmpty {
      return partialText
    }

    if partialText.isEmpty {
      return finalText
    }

    return "\(finalText)\n\(partialText)"
  }
}

private actor SpeechBridge {
  static let shared = SpeechBridge()

  private var model: ParakeetStreamingASRModel?
  private var modelTask: Task<ParakeetStreamingASRModel, Error>?
  private var activeSession: LiveTranscriptionSession?
  private var downloadState = ModelDownloadPayload(
    status: "idle",
    currentFile: nil,
    localPath: "",
    error: nil
  )

  init() {
    refreshReadyState()
  }

  func cacheDirectory() -> String {
    if downloadState.localPath.isEmpty {
      downloadState.localPath = Self.cacheDirectoryPath()
    }

    return downloadState.localPath
  }

  func modelDownloadStateJSON() -> String {
    refreshReadyState()
    return encodeJSON(downloadState)
  }

  func startModelDownload() {
    refreshReadyState()

    if downloadState.status == "ready", model != nil {
      return
    }

    if modelTask != nil {
      downloadState.status = "downloading"
      return
    }

    downloadState.status = "downloading"
    downloadState.currentFile = "Preparing speech-swift model..."
    downloadState.error = nil

    let task = Task.detached(priority: .utility) {
      try await ParakeetStreamingASRModel.fromPretrained { fraction, status in
        Task {
          await SpeechBridge.shared.updateDownloadProgress(fraction: fraction, status: status)
        }
      }
    }

    modelTask = task

    Task.detached {
      do {
        let model = try await task.value
        await SpeechBridge.shared.finishModelLoad(model)
      } catch {
        await SpeechBridge.shared.finishModelLoad(error: error)
      }
    }
  }

  func resetModel() {
    activeSession?.stop()
    activeSession = nil
    model = nil
    modelTask = nil
    refreshReadyState()

    if downloadState.status != "ready" {
      downloadState.status = "idle"
    }

    downloadState.currentFile = nil
    downloadState.error = nil
  }

  func startTranscriptionJSON() async -> String {
    activeSession?.stop()
    activeSession = nil

    do {
      let model = try await ensureModelLoaded()
      let session = try LiveTranscriptionSession(model: model)
      try session.start()
      activeSession = session
      return encodeJSON(session.snapshot())
    } catch {
      return encodeJSON(
        TranscriptionPayload(
          running: false,
          text: "",
          error: error.localizedDescription
        )
      )
    }
  }

  func transcriptionStateJSON() -> String {
    guard let activeSession else {
      return encodeJSON(TranscriptionPayload.empty)
    }

    let snapshot = activeSession.snapshot()
    if !snapshot.running {
      self.activeSession = nil
    }

    return encodeJSON(snapshot)
  }

  func stopTranscriptionJSON() -> String {
    guard let activeSession else {
      return encodeJSON(TranscriptionPayload.empty)
    }

    activeSession.stop()
    let snapshot = activeSession.snapshot()
    self.activeSession = nil
    return encodeJSON(snapshot)
  }

  private func ensureModelLoaded() async throws -> ParakeetStreamingASRModel {
    refreshReadyState()

    if let model {
      return model
    }

    if let modelTask {
      let loaded = try await modelTask.value
      self.model = loaded
      return loaded
    }

    let loaded = try await ParakeetStreamingASRModel.fromPretrained()
    self.model = loaded
    refreshReadyState()
    return loaded
  }

  private func updateDownloadProgress(fraction: Double, status: String) {
    downloadState.status = "downloading"
    downloadState.localPath = cacheDirectory()
    downloadState.error = nil

    let percent = Int(max(0.0, min(1.0, fraction)) * 100.0)
    let statusText = status.trimmingCharacters(in: .whitespacesAndNewlines)
    if statusText.isEmpty {
      downloadState.currentFile = "Preparing speech-swift model... (\(percent)%)"
    } else {
      downloadState.currentFile = "\(statusText) (\(percent)%)"
    }
  }

  private func finishModelLoad(_ model: ParakeetStreamingASRModel) {
    self.model = model
    modelTask = nil
    downloadState.localPath = cacheDirectory()
    downloadState.status = "ready"
    downloadState.currentFile = nil
    downloadState.error = nil
  }

  private func finishModelLoad(error: Error) {
    modelTask = nil
    downloadState.localPath = cacheDirectory()
    downloadState.status = "error"
    downloadState.currentFile = nil
    downloadState.error = error.localizedDescription
  }

  private func refreshReadyState() {
    let localPath = Self.cacheDirectoryPath()
    downloadState.localPath = localPath

    if modelTask != nil {
      return
    }

    if Self.modelFilesReady(at: URL(fileURLWithPath: localPath, isDirectory: true)) {
      downloadState.status = "ready"
      downloadState.error = nil
      return
    }

    if downloadState.status == "ready" {
      downloadState.status = "idle"
      downloadState.currentFile = nil
    }
  }

  private static func cacheDirectoryPath() -> String {
    do {
      return try HuggingFaceDownloader.getCacheDirectory(
        for: ParakeetStreamingASRModel.defaultModelId
      ).path
    } catch {
      return ""
    }
  }

  private static func modelFilesReady(at directory: URL) -> Bool {
    let fileManager = FileManager.default

    return fileManager.fileExists(atPath: directory.appendingPathComponent("config.json").path)
      && fileManager.fileExists(atPath: directory.appendingPathComponent("vocab.json").path)
      && fileManager.fileExists(atPath: directory.appendingPathComponent("encoder.mlmodelc").path)
      && fileManager.fileExists(atPath: directory.appendingPathComponent("decoder.mlmodelc").path)
      && fileManager.fileExists(atPath: directory.appendingPathComponent("joint.mlmodelc").path)
  }
}

@_cdecl("_speech_model_cache_dir")
public func _speech_model_cache_dir() -> SRString {
  SRString(waitForValue { await SpeechBridge.shared.cacheDirectory() })
}

@_cdecl("_speech_model_download_state")
public func _speech_model_download_state() -> SRString {
  SRString(waitForValue { await SpeechBridge.shared.modelDownloadStateJSON() })
}

@_cdecl("_speech_model_start_download")
public func _speech_model_start_download() -> Bool {
  waitForValue {
    await SpeechBridge.shared.startModelDownload()
    return true
  }
}

@_cdecl("_speech_model_reset")
public func _speech_model_reset() -> Bool {
  waitForValue {
    await SpeechBridge.shared.resetModel()
    return true
  }
}

@_cdecl("_speech_live_transcription_start")
public func _speech_live_transcription_start() -> SRString {
  SRString(waitForValue { await SpeechBridge.shared.startTranscriptionJSON() })
}

@_cdecl("_speech_live_transcription_state")
public func _speech_live_transcription_state() -> SRString {
  SRString(waitForValue { await SpeechBridge.shared.transcriptionStateJSON() })
}

@_cdecl("_speech_live_transcription_stop")
public func _speech_live_transcription_stop() -> SRString {
  SRString(waitForValue { await SpeechBridge.shared.stopTranscriptionJSON() })
}
