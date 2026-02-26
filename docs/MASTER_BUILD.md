# 🧠 MASTER BUILD PROMPT — Nexus AI (Offline, Mobile, Live Voice)

> Build a fully offline, mobile-first AI assistant app for Android (ARM64) that runs entirely on-device with no external servers or APIs.

## Core Requirements
*   Architecture optimized for ARM64 mobile devices (Galaxy S25 class)
*   Fully offline operation (air-gapped capable)
*   ChatGPT-style chat UI with:
    *   Streaming responses
    *   Markdown rendering
    *   Code blocks with copy buttons
    *   Chat history memory with continuation support

## Local LLM
*   Use llama.cpp with GGUF models
*   Default model: Llama-3.1-8B-Instruct (Q5_K_M)
*   Native llama sampling only (no OpenAI penalties)
*   Reflection-aware streaming:
    *   First token delayed until response coherence is verified
    *   Sentence-level streaming (not token-level)

## Live Voice Mode (CRITICAL)
*   Hands-free conversation (VAD-based)
*   Streaming Whisper.cpp for ASR
*   Sentence-level TTS buffering
*   Overlap-add audio streaming (30 ms chunks, 10 ms overlap)
*   Piper acoustic model + HiFi-GAN neural vocoder
*   Prosody engine with pitch, rate, energy variation
*   Natural pauses, turn-taking, and barge-in support
*   RMS normalization and soft limiting

## Voice Quality Goals
*   Sounds indistinguishable from a real human in short conversations
*   No choppiness, clicks, or robotic cadence
*   Emotional prosody (confidence, curiosity, calm)

## UX Constraints
*   Keep existing theme, layout, and UI unchanged
*   All enhancements must be internal (engine-level)

## Stability Rules
*   No token-level TTS
*   No zero-overlap audio playback
*   No flat prosody
*   No cloud dependencies
*   Lock configs to prevent regression

## Deliverables
*   Production-ready Android app
*   Local LLM inference
*   Live voice mode matching or exceeding ChatGPT live voice quality
*   Config-driven system with locked defaults
*   README with exact build steps

The result must feel like speaking to a calm, intelligent human — not an AI.