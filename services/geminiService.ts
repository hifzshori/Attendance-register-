import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize } from "../types";

// Helper to get AI instance safely
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateChatMessage = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
  try {
    const ai = getAIInstance();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are a helpful, encouraging, and organized teaching assistant for a school teacher. Keep answers concise and relevant to classroom management, education, or general knowledge."
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const generateClassroomImage = async (prompt: string, size: ImageSize) => {
  try {
    const ai = getAIInstance();
    
    // Using the pro model for best quality image generation as per requirements for "code generation" (GenAI features)
    const model = 'gemini-3-pro-image-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};