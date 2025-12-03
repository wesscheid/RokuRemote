import { GoogleGenAI, Type } from "@google/genai";
import { SmartCommandResponse } from "../types";

// Initialize Gemini Client
// Requires process.env.API_KEY to be set
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseNaturalLanguageCommand = async (prompt: string): Promise<SmartCommandResponse> => {
  try {
    const model = "gemini-2.5-flash";
    
    const systemInstruction = `
      You are an intelligent controller for a Roku TV. 
      Your job is to translate natural language user requests into a sequence of Roku ECP (External Control Protocol) keypress commands.

      Valid Roku Keys:
      Power, PowerOff, PowerOn, Home, Rev, Fwd, Play, Select, Left, Right, Down, Up, Back, 
      InstantReplay, Info, Backspace, Search, Enter, VolumeDown, VolumeMute, VolumeUp.

      If the user wants to open a specific app (like Netflix, YouTube), you cannot launch it directly by name in this mode, 
      so you should navigate to Home first. If the request is complex, break it down.
      
      Example: "Turn it up" -> ["VolumeUp", "VolumeUp", "VolumeUp"]
      Example: "Go home and mute" -> ["Home", "VolumeMute"]
      Example: "Pause" -> ["Play"] (Play acts as toggle)
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The list of Roku key commands to execute in order."
            },
            explanation: {
              type: Type.STRING,
              description: "Brief explanation of what the sequence does."
            }
          },
          required: ["commands", "explanation"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as SmartCommandResponse;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};