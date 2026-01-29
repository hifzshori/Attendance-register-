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

export const generateClassroomImage = async (prompt: string, size: ImageSize): Promise<string> => {
  try {
    const ai = getAIInstance();
    
    // Default to gemini-2.5-flash-image for 1K (standard quality)
    let model = 'gemini-2.5-flash-image';
    const imageConfig: any = {
      aspectRatio: '1:1'
    };

    // Use gemini-3-pro-image-preview for high quality (2K, 4K)
    if (size === ImageSize.SIZE_2K || size === ImageSize.SIZE_4K) {
      model = 'gemini-3-pro-image-preview';
      imageConfig.imageSize = size;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig
      }
    });

    // Find the image part in the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }

    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};