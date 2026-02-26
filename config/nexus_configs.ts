
import { NexusConfig, VoiceConfig, ToolConfig, DevOverlayConfig, PersonalityConfig, CodeStreamingConfig } from '../types';

// 📄 nexus_llm_core.yaml (Locked)
export const NEXUS_LLM_CORE: NexusConfig = {
  model: {
    primary: 'Meta-Llama-3.1-8B-Instruct.Q5_K_M.gguf', // 🔒 Locked Best Model
    draft: 'Llama-3.2-3B-Instruct.Q4_K_M.gguf',
    context_length: 8192,
  },
  generation: {
    temperature: 0.72, // 🔒 Fixed: Medium-High for creativity/reasoning
    top_p: 0.92,
    top_k: 40,
    repeat_penalty: 1.12,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
    min_tokens: 120, // 🔒 No short answers
    max_tokens: 2048,
    stop_sequences: ["<|eot_id|>"],
  },
  quality_guards: {
    reflection_pass: true,
    confidence_gate: true,
    min_sentences: 3,
    sentence_aligned_streaming: true,
    confidence_threshold: 0.25,
    regenerate_on_failure: true,
    delay_first_token_ms: 120 // 🔒 Reflection Buffer
  },
  streaming: {
    delay_first_token_ms: 120
  }
};

// 📄 chat/config/code_streaming.yaml
export const NEXUS_CODE_STREAMING: CodeStreamingConfig = {
  enabled: true,
  stream_unit: 'line',
  min_line_delay_ms: 60, // 🔒 Syncs with voice speed
  enforce_fenced_blocks: true,
  auto_copy_button: true
};

// 📄 nexus_memory.yaml (Locked)
export const NEXUS_MEMORY = {
  memory: {
    mode: 'weighted',
    short_term_weight: 1.0,
    long_term_weight: 0.45,
    decay_rate: 'slow',
    anchor_blocks: ['code', 'instructions', 'user_goals'],
  },
  continuation: {
    allow_resume: true,
    prefer_last_output: true,
    merge_incomplete_generations: true,
  }
};

// 📄 voice/config/tts.yaml (Locked) & voice/config/prosody.yaml (Locked)
export const NEXUS_VOICE_PROFILES: VoiceConfig = {
  engine: 'piper',
  language: 'en-US',
  acoustic_model: {
    name: 'en_US-medium',
    format: 'onnx',
    precision: 'fp16',
    threads: 4,
    phoneme_duration_control: true
  },
  vocoder: {
    type: 'hifigan',
    model: 'hifigan-mobile-small',
    format: 'onnx',
    precision: 'fp16',
    threads: 2
  },
  audio: {
    sample_rate: 24000,
    channels: 1,
    pcm_format: 'float32'
  },
  streaming: {
    chunk_ms: 20, 
    overlap_ms: 5,
    max_queue_ms: 100,
    min_phrase_words: 4 
  },
  normalization: {
    target_lufs: -14,
    limiter: 'soft',
    denoise: 'light'
  },
  prosody: {
    global: {
      base_speaking_rate: 1.0, 
      min_rate: 0.9,
      max_rate: 1.15,
      base_pitch: '0%',
      pitch_variance: '12%', // Increased variance for less monotone speech
      energy: 'high'
    },
    cadence: {
      words_per_minute_target: 160,
      max_words_per_burst: 15
    },
    explanation_mode: {
      speaking_rate: 0.95,
      pitch_variance: '15%',
      pause_after_sentence_ms: 150
    },
    breath_model: {
      enabled: true,
      breath_pause_ms: 100,
      every_n_sentences: 3
    },
    rules: {
      sentence_end: { pause_after_ms: 150 }, 
      question: { pause_after_ms: 200, pitch_rise_end: true }, 
      comma: { pause_after_ms: 50 }, 
      paragraph: { pause_after_ms: 300 },
      code_block: { pause_after_ms: 200 }
    }
  }
};

// 📄 voice/personalities/nexus_human.yaml (Locked)
export const NEXUS_PERSONALITY: PersonalityConfig = {
  id: 'nexus-human-v1',
  name: 'Nexus',
  description: 'Calm, confident, intelligent, emotionally aware',
  baseline: {
    pitch: '-2%',
    rate: 1.0,
    warmth: 'high',
    articulation: 'natural',
    breathiness: 'moderate'
  },
  dynamics: {
    pitch_range: '±12%',
    rate_range: '±10%',
    energy_floor: 'medium'
  },
  behavior: {
    pauses_are_meaningful: true,
    avoids_rushed_speech: true,
    emphasizes_key_phrases: true
  },
  turn_taking: {
    wait_after_user_ms: 100,
    allow_barge_in: true,
    interrupt_on_user_voice: true
  },
  emotion_mapping: {
    confident: {
      pitch_delta: 0.05,
      rate: 1.05
    }
  }
};

// 📄 nexus_tools.yaml (Locked)
export const NEXUS_TOOLS: ToolConfig = {
  tools: {
    file_read: {
      description: 'Read a local file',
      side_effects: false,
      requires_confirmation: false,
    },
    file_write: {
      description: 'Write or modify a local file',
      side_effects: true,
      requires_confirmation: true,
    },
    shell_command: {
      description: 'Execute a local system command',
      side_effects: true,
      requires_confirmation: true,
    },
    memory_export: {
      description: 'Export encrypted memory snapshot',
      side_effects: true,
      requires_confirmation: true,
    },
  },
};

// 📄 nexus_dev_overlay.yaml (Locked)
export const NEXUS_DEV_OVERLAY: DevOverlayConfig = {
  developer_overlay: {
    enabled: false,
    panels: ['tokens', 'memory', 'voice', 'performance'],
    safe_mode: true,
  },
};

export const LOCKED_FILES = [
  { name: 'nexus_llm_core.yaml', content: JSON.stringify(NEXUS_LLM_CORE, null, 2) },
  { name: 'chat/config/code_streaming.yaml', content: JSON.stringify(NEXUS_CODE_STREAMING, null, 2) },
  { name: 'nexus_memory.yaml', content: JSON.stringify(NEXUS_MEMORY, null, 2) },
  { name: 'voice/config/tts.yaml', content: JSON.stringify({
      engine: NEXUS_VOICE_PROFILES.engine,
      acoustic_model: NEXUS_VOICE_PROFILES.acoustic_model,
      vocoder: NEXUS_VOICE_PROFILES.vocoder,
      audio: NEXUS_VOICE_PROFILES.audio,
      streaming: NEXUS_VOICE_PROFILES.streaming,
      normalization: NEXUS_VOICE_PROFILES.normalization
  }, null, 2) },
  { name: 'voice/config/prosody.yaml', content: JSON.stringify(NEXUS_VOICE_PROFILES.prosody, null, 2) },
  { name: 'voice/personalities/nexus_human.yaml', content: JSON.stringify(NEXUS_PERSONALITY, null, 2) },
  { name: 'nexus_tools.yaml', content: JSON.stringify(NEXUS_TOOLS, null, 2) },
  { name: 'nexus_dev_overlay.yaml', content: JSON.stringify(NEXUS_DEV_OVERLAY, null, 2) },
];
