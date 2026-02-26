
export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isSystem?: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
}

export interface AppState {
  view: 'chat' | 'voice' | 'diagnostics';
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isOfflineMode: boolean;
  devMode: boolean;
  activeVoiceId: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
  presetId: string;
}

export enum ModelType {
  Llama3_8B_Q5 = 'Meta-Llama-3.1-8B-Instruct.Q5_K_M.gguf',
  Llama3_Draft_Q4 = 'Llama-3.2-3B-Instruct.Q4_K_M.gguf',
}

export interface NexusConfig {
  model: {
    primary: string;
    draft: string;
    context_length: number;
  };
  generation: {
    temperature: number;
    top_p: number;
    top_k: number;
    repeat_penalty: number;
    presence_penalty: number;
    frequency_penalty: number;
    min_tokens: number;
    max_tokens: number;
    stop_sequences: string[];
  };
  quality_guards: {
    reflection_pass: boolean;
    confidence_gate: boolean;
    min_sentences: number;
    sentence_aligned_streaming: boolean;
    confidence_threshold: number;
    regenerate_on_failure: boolean;
    delay_first_token_ms: number;
  };
  streaming?: {
    delay_first_token_ms: number;
  };
}

export interface CodeStreamingConfig {
  enabled: boolean;
  stream_unit: 'line' | 'token';
  min_line_delay_ms: number;
  enforce_fenced_blocks: boolean;
  auto_copy_button: boolean;
}

export interface RegressionTestResult {
  id: string;
  category: string;
  input: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  output?: string;
  reason?: string;
}

export interface VoiceConfig {
  engine: string;
  language: string;
  acoustic_model: {
    name: string;
    format: string;
    precision: string;
    threads: number;
    phoneme_duration_control: boolean;
  };
  vocoder: {
    type: string;
    model: string;
    format: string;
    precision: string;
    threads: number;
  };
  audio: {
    sample_rate: number;
    channels: number;
    pcm_format: string;
  };
  streaming: {
    chunk_ms: number;
    overlap_ms: number;
    max_queue_ms: number;
    min_phrase_words: number;
  };
  normalization: {
    target_lufs: number;
    limiter: string;
    denoise: string;
  };
  prosody: {
    global: {
      base_speaking_rate: number;
      min_rate: number;
      max_rate: number;
      base_pitch: string;
      pitch_variance: string;
      energy: string;
    };
    cadence: {
      words_per_minute_target: number;
      max_words_per_burst: number;
    };
    explanation_mode: {
      speaking_rate: number;
      pitch_variance: string;
      pause_after_sentence_ms: number;
    };
    breath_model: {
      enabled: boolean;
      breath_pause_ms: number;
      every_n_sentences: number;
    };
    rules: Record<string, any>;
  };
}

export interface PersonalityConfig {
  id: string;
  name?: string;
  description: string;
  baseline: {
    pitch: string;
    rate: number;
    warmth: string;
    articulation: string;
    breathiness: string;
  };
  dynamics: {
    pitch_range: string;
    rate_range: string;
    energy_floor: string;
  };
  behavior: {
    pauses_are_meaningful: boolean;
    avoids_rushed_speech: boolean;
    emphasizes_key_phrases: boolean;
  };
  turn_taking: {
    wait_after_user_ms: number;
    allow_barge_in: boolean;
    interrupt_on_user_voice: boolean;
  };
  emotion_mapping?: {
    confident: {
      pitch_delta: number;
      rate: number;
    };
  };
}

export interface Tool {
  description: string;
  side_effects: boolean;
  requires_confirmation: boolean;
}

export interface ToolConfig {
  tools: Record<string, Tool>;
}

export interface DevOverlayConfig {
  developer_overlay: {
    enabled: boolean;
    panels: string[];
    safe_mode: boolean;
  };
}

export interface StreamToken {
  text: string;
  confidence: number;
  isSentenceEnd: boolean;
  isCodeLine?: boolean;
  prosody?: {
    pitch: number;
    rate: number;
    energy: number;
  };
  thinking?: string | null;
}
