
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, StreamToken } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { NEXUS_LLM_CORE, NEXUS_PERSONALITY, NEXUS_CODE_STREAMING } from '../config/nexus_configs';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * 🧠 Nexus Hardened Generation Engine
 */

// 🦀 Prosody Logic
function applyPersonality(confidence: number, text: string) {
  const isCode = text.includes("```") || text.includes("function") || text.includes("const ");
  const isExplanation = text.length > 50 && !isCode;
  
  let pitch = 1.0;
  let rate = NEXUS_PERSONALITY.baseline.rate;
  let energy = 0.9;

  if (isCode) {
    pitch = 0.94; rate = 0.88; energy = 0.75; // Slower for code
  } else if (isExplanation) {
    pitch = 0.96; rate = 0.92; energy = 0.85; // Measured for explanation
  } else {
    pitch = 1.02; rate = 1.0; energy = 0.9;
  }

  if (confidence < 0.8) {
    rate *= 0.95;
    pitch *= 0.98;
  }

  return { pitch, rate, energy };
}

// 🔹 Reflection-Aware Check
// Returns true if the initial buffer looks coherent
function checkReflection(buffer: string): boolean {
    const identitySpam = /(I am Nexus|As an AI|I am an AI)/i;
    const tooShort = buffer.length < 15 && !buffer.includes("```");
    
    if (identitySpam.test(buffer)) return false;
    if (tooShort) return false;
    
    return true;
}

// 🔹 Context Continuation Logic
// Appends to the last model message if user says "continue"
function prepareHistory(history: Message[], newMessage: string) {
    const isContinuation = /^(continue|go on|keep going|next part)/i.test(newMessage.trim());
    
    if (isContinuation && history.length > 0) {
        const lastModelMsg = [...history].reverse().find(m => m.role === 'model');
        if (lastModelMsg) {
            // Re-inject last message as a pre-fill (conceptually) or just append to prompt
            // For Chat API, we can't easily force pre-fill, so we structure the prompt to ask for completion.
            return {
                preparedHistory: history, // Keep history as is
                prompt: `CONTINUATION_REQUEST: The user wants you to continue exactly where you left off in the previous message. Start immediately with the next sentence or line of code. \n\nPREVIOUS_END: "...${lastModelMsg.content.slice(-50)}"` 
            };
        }
    }
    return { preparedHistory: history, prompt: newMessage };
}

export async function* streamInference(
  history: Message[],
  newMessage: string,
  isOfflineForced: boolean
): AsyncGenerator<StreamToken> {
  
  // 1️⃣ Reflection Phase
  yield { text: "", confidence: 1, isSentenceEnd: false, thinking: "Reflecting..." };
  
  // Simulate Reflection Latency (Hard-Locked Config)
  await new Promise(resolve => setTimeout(resolve, NEXUS_LLM_CORE.quality_guards.delay_first_token_ms)); 

  // Clear thinking state
  yield { text: "", confidence: 1, isSentenceEnd: false, thinking: null };

  if (isOfflineForced || !apiKey) {
    yield { text: "Offline mode active. System constraints enforced.", confidence: 1, isSentenceEnd: true };
    return;
  }

  // 2️⃣ Context & Prompt Prep (Continuation Logic)
  const { preparedHistory, prompt } = prepareHistory(history, newMessage);

  try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview', 
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: NEXUS_LLM_CORE.generation.temperature,
          topP: NEXUS_LLM_CORE.generation.top_p,
          topK: NEXUS_LLM_CORE.generation.top_k,
          maxOutputTokens: NEXUS_LLM_CORE.generation.max_tokens,
          stopSequences: NEXUS_LLM_CORE.generation.stop_sequences,
          // presencePenalty: 0.0, // Not supported in this SDK version typing, but implied 0
          // frequencyPenalty: 0.0,
        },
        history: preparedHistory
          .filter(m => !m.isSystem && !m.isThinking)
          .map(m => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
      });

      const resultStream = await chat.sendMessageStream({ message: prompt });
      
      let streamBuffer = "";
      let totalText = "";
      let isInsideCodeBlock = false;
      let codeBuffer = "";
      let reflectionPassed = false;
      let reflectionBuffer = "";

      for await (const chunk of resultStream) {
          const c = chunk as GenerateContentResponse;
          const chunkText = c.text || "";
          
          if (!chunkText) continue;

          // 3️⃣ Reflection Guard (First ~50 chars)
          if (!reflectionPassed) {
              reflectionBuffer += chunkText;
              if (reflectionBuffer.length > 40) {
                  if (checkReflection(reflectionBuffer)) {
                      reflectionPassed = true;
                      streamBuffer += reflectionBuffer; // Flush valid buffer to main stream logic
                  } else {
                      // Failed reflection - silent regeneration simulation
                      // In real engine: abort and retry.
                      // Here: we strip the bad prefix and proceed.
                      console.warn("Reflection guard triggered: Identity spam detected. Stripping...");
                      const cleaned = reflectionBuffer.replace(/(I am Nexus|As an AI|I am an AI)[.,!]?\s*/i, "");
                      reflectionPassed = true;
                      streamBuffer += cleaned;
                  }
              } else {
                  continue; // Keep buffering
              }
          } else {
              streamBuffer += chunkText;
          }

          // 4️⃣ Live Code Streaming Logic
          // We check if we are entering or exiting a code block
          // Note: This simple check assumes ``` is not split across chunks (statistically safe for chunk streaming)
          if (streamBuffer.includes("```")) {
              const parts = streamBuffer.split("```");
              // Toggle state based on parity of occurrence
              // This is a naive split; robust parsing would track state more carefully.
              // For simulation: assume if we see ``` we might be toggling.
          }
          
          // More robust Code Line Buffering
          // If we detect we are likely in code (or just enforcing line buffering for everything to be safe/smooth)
          // The spec says "Code streamed line-by-line".
          
          let lineMatch;
          // While we have a newline in the buffer
          // eslint-disable-next-line no-cond-assign
          while ((lineMatch = streamBuffer.match(/^.*?\n/s))) {
              const line = lineMatch[0];
              streamBuffer = streamBuffer.substring(line.length);
              
              // Detect Code Block Toggles in this line
              if (line.includes("```")) {
                  isInsideCodeBlock = !isInsideCodeBlock;
              }

              totalText += line;
              
              // 5️⃣ Yield Line (with Delay if Code)
              if (isInsideCodeBlock && NEXUS_CODE_STREAMING.enabled) {
                  // Simulate typing delay for code
                  await new Promise(r => setTimeout(r, NEXUS_CODE_STREAMING.min_line_delay_ms));
                  yield {
                      text: line,
                      confidence: 1.0,
                      isSentenceEnd: false,
                      isCodeLine: true,
                      prosody: applyPersonality(1.0, totalText)
                  };
              } else {
                  // Standard Sentence Processing for prose
                  // We can output the line, or split it further into sentences if it contains multiple.
                  // For simplicity + voice sync, yielding by natural chunks/sentences is best.
                  yield {
                       text: line,
                       confidence: 0.95,
                       isSentenceEnd: /[.!?]\s*$/.test(line.trim()),
                       prosody: applyPersonality(0.95, totalText)
                  };
              }
          }
      }

      // Flush remaining
      if (streamBuffer.length > 0) {
          totalText += streamBuffer;
          yield {
              text: streamBuffer,
              confidence: 1.0,
              isSentenceEnd: true,
              prosody: applyPersonality(1.0, totalText)
          };
      }

  } catch (error: any) {
      console.error("Inference Error:", error);
      yield { text: `[Error: ${error.message}]`, confidence: 0, isSentenceEnd: true };
  }
}
