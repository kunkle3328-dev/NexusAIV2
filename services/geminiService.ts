import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize the API client
// Note: In a real production app, this should be handled via a backend proxy to secure the key.
// For this frontend-only prototype, we assume the environment variable is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export async function* streamChatResponse(
  history: Message[],
  newMessage: string,
  modelName: string = 'gemini-3-flash-preview'
) {
  if (!apiKey) {
    yield { text: "Error: API Key is missing. Please configure process.env.API_KEY.", thinking: null };
    return;
  }

  try {
    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history
        .filter(m => !m.isSystem && !m.isThinking)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
    });

    // Simulate "Reflection" phase visually by yielding an initial thinking state
    // In a real implementation with thinkingConfig, we would parse that.
    // Here we simulate the "Reflection-First Pass" mandated by the prompt.
    
    // Send message stream
    const resultStream = await chat.sendMessageStream({
        message: newMessage,
    });

    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield { text: c.text, thinking: null };
      }
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    yield { text: `\n\n[System Error: ${error.message || 'Inference Engine Failure'}]`, thinking: null };
  }
}