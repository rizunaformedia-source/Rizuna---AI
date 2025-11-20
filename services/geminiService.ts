
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { GenerationPayload, CinematicControls } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateStoryImage = async (
    payload: GenerationPayload,
    cinematicControls: CinematicControls
): Promise<Array<{ imageUrl: string; prompt: string; payload: GenerationPayload }>> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please configure it to use the application.');
  }

  const { prompt, images } = payload;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const MAX_RETRIES = 5;

  const handleApiError = async (error: unknown, attempt: number): Promise<{ shouldRetry: boolean; errorToThrow: Error }> => {
      console.error(`Gemini API Call Error (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      let errorMessage = 'An unknown error occurred.';
      let isQuotaError = false;

      try {
        const errorString = JSON.stringify(error).toLowerCase();
        const message = ((error as Error)?.message || '').toLowerCase();
        
        if (message.includes('image_other') || errorString.includes('image_other')) {
            errorMessage = 'The AI failed to generate the image. This can happen with very complex or contradictory requests. Please try simplifying your prompt or cinematic controls. For example, when using a specific "Camera Perspective", try setting "Shot Type" to "None".';
            return { shouldRetry: false, errorToThrow: new Error(errorMessage) };
        }

        if (errorString.includes('429') || errorString.includes('quota') || errorString.includes('resource_exhausted')) {
          isQuotaError = true;
          errorMessage = 'API quota exceeded.'; 
        } else {
          errorMessage = (error as Error)?.message || JSON.stringify(error);
        }
      } catch (e) {
         errorMessage = String(error);
      }
      
      const finalError = new Error(errorMessage);
      
      if (isQuotaError && attempt < MAX_RETRIES) {
        const delay = 3000 * (2 ** attempt) + Math.random() * 1000;
        console.log(`Quota error detected. Retrying in ${Math.round(delay/1000)}s...`);
        await sleep(delay);
        return { shouldRetry: true, errorToThrow: finalError };
      }
      
      if (isQuotaError) {
          return { shouldRetry: false, errorToThrow: new Error('API quota exceeded. The operation failed after several retries. Please check your usage in the Google Cloud Console or try again later.') };
      }
      
      return { shouldRetry: false, errorToThrow: new Error(`The image generation API failed. ${finalError.message}`) };
  };

  if (images && images.length > 0) {
    // --- Use gemini-2.5-flash-image when images are provided ---
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64Data,
        mimeType: image.mimeType,
      },
    }));
    
    const generateOneImage = async (): Promise<{ imageUrl: string; prompt: string; payload: GenerationPayload }> => {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            ...imageParts,
                            { text: prompt },
                        ],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE, Modality.TEXT],
                    },
                });

                console.log('Gemini API Response (gemini-2.5-flash-image):', JSON.stringify(response, null, 2));
                
                if (!response.candidates || response.candidates.length === 0) {
                  let errorMessage = 'Image generation failed: The API returned no candidates.';
                  if (response.promptFeedback?.blockReason) {
                      errorMessage = `Request was blocked. Reason: ${response.promptFeedback.blockReason}.`;
                      if (response.promptFeedback.blockReasonMessage) {
                          errorMessage += ` Message: ${response.promptFeedback.blockReasonMessage}`;
                      }
                  } else {
                      errorMessage += ' This might be due to a content filter or other policy violation.';
                  }
                  throw new Error(errorMessage);
                }

                const firstCandidate = response.candidates[0];

                if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
                    let errorMessage = 'Invalid response structure from API: The candidate in the response has no content parts.';
                    if (response.promptFeedback?.blockReason) {
                        errorMessage = `Request was blocked. Reason: ${response.promptFeedback.blockReason}. Message: ${response.promptFeedback.blockReasonMessage || 'No specific message provided.'}`;
                    } else if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
                        errorMessage = `Image generation finished unexpectedly. Reason: ${firstCandidate.finishReason}. ${firstCandidate.finishMessage || ''}`;
                    }
                    throw new Error(errorMessage);
                }

                for (const part of firstCandidate.content.parts) {
                  if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    return { imageUrl, prompt, payload };
                  }
                }
                
                throw new Error(`Image generation failed. Model returned text instead of an image: ${response.text || 'No image data was found in the response.'}`);

            } catch (error) {
                const { shouldRetry, errorToThrow } = await handleApiError(error, attempt);
                if (!shouldRetry) {
                    throw errorToThrow;
                }
            }
        }
        throw new Error('An unknown error occurred after all retries.');
    };
    
    const generationPromises = Array.from({ length: cinematicControls.numberOfImages }).map(() => generateOneImage());
    return await Promise.all(generationPromises);

  } else {
    // --- Use imagen-4.0-generate-01 for text-only generation ---
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: cinematicControls.numberOfImages,
                outputMimeType: 'image/png',
                aspectRatio: cinematicControls.aspectRatio,
            },
        });

        console.log('Gemini API Response (imagen-4.0-generate-001):', JSON.stringify(response, null, 2));

        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image?.imageBytes) {
            throw new Error('Image generation failed: The API returned no images.');
        }

        const generatedImages = response.generatedImages.map(img => {
            const base64ImageBytes: string = img.image.imageBytes;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            return { imageUrl, prompt, payload };
        });

        return generatedImages;

      } catch (error) {
        const { shouldRetry, errorToThrow } = await handleApiError(error, attempt);
        if (!shouldRetry) {
            throw errorToThrow;
        }
      }
    }
  }
  
  throw new Error('An unknown error occurred after all retries.');
};

export const improveEditPrompt = async (
  editInstruction: string,
  hasReferenceImage: boolean,
  hasMask: boolean
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set.');
  }
  if (!editInstruction.trim()) {
    return '';
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const metaPrompt = `You are a master prompt engineer for a powerful AI image generation model that can edit existing images based on text, an optional reference image, and an optional mask.

Your task is to take a user's simple edit instruction and create a sophisticated, detailed, and professional prompt that will produce a high-quality, seamless, and photorealistic result.

Here is the context:
- The base image is the starting point for the edit.
- The user provides an instruction: "${editInstruction}".
- The user has ${hasReferenceImage ? 'provided a secondary reference image' : 'not provided a secondary reference image'} to guide the edit.
- The user has ${hasMask ? 'provided a black and white mask image. The white area of the mask specifies the exact region to be edited.' : 'not provided a mask, so the edit should be applied to the most logical area of the image.'}

Your generated prompt must:
1.  Clearly state the primary editing action based on the user's instruction.
2.  ${hasMask ? "CRITICAL: Instruct the model to apply the change ONLY within the white area of the provided mask, leaving the black areas completely untouched. This is the most important instruction." : ""}
3.  ${hasReferenceImage ? "Incorporate details from the reference image, instructing the model to blend its style, subject, or features into the masked area of the base image." : ""}
4.  Emphasize maintaining the overall style, lighting, and composition of the base image to ensure the edit looks natural and not "pasted on", especially at the boundary of the masked region.
5.  Use descriptive and professional language that the image model will understand well (e.g., use terms like 'seamlessly integrate', 'match the lighting and color grading', 'ensure realistic shadows and reflections at the mask edge').
6.  The final output should ONLY be the new prompt itself, without any conversational text, explanation, or markdown formatting like "**".

User Instruction: "${editInstruction}"

Generate the professional prompt now.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const improvedPrompt = response.text.trim().replace(/^\*+\s*|\s*\*+$/g, '');
    return improvedPrompt;

  } catch (error) {
    console.error('Error improving prompt with Gemini:', error);
    let fallback = `Apply the following edit: "${editInstruction}".`;
    if (hasMask) {
        fallback += ' Confine the edit strictly to the masked area.';
    }
    if (hasReferenceImage) {
        fallback += ' Use the provided reference image for inspiration.';
    }
    fallback += ' Ensure the result is high-quality and seamlessly integrated.';
    return fallback;
  }
};

export const improveSceneDescription = async (sceneDescription: string, hasCharacterImages: boolean): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable is not set.');
    }
    if (!sceneDescription.trim()) {
      return '';
    }
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const characterInstruction = hasCharacterImages 
      ? `This is the most critical instruction: The user has provided reference images for characters. Your primary and most important goal is to craft a description that ensures the image generation model preserves the exact facial features, hair, and overall likeness of these characters with the highest possible fidelity. The entire cinematic description you create should be built around this core requirement of character preservation. All other atmospheric and descriptive enhancements are secondary to maintaining the character's appearance.`
      : '';

    // FIX: The variable name 'meta-prompt' is invalid in TypeScript. Changed to 'metaPrompt'.
    const metaPrompt = `You are a master prompt engineer for a powerful AI image generation model. Your task is to take a user's simple scene description and expand it into a more vivid, detailed, and atmospheric prompt that will produce a high-quality, cinematic image.

${characterInstruction}

Your enhancement should focus on sensory details, lighting, mood, and composition. Do not change the core subject of the user's description, but build upon it.

The final output must ONLY be the new, improved scene description itself, without any conversational text, explanation, or markdown formatting.

User's Description: "${sceneDescription}"

Generate the professional, enhanced scene description now.`;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: metaPrompt,
        config: {
          temperature: 0.5,
          topP: 0.95,
          topK: 40,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      const improvedDescription = response.text.trim();
      return improvedDescription;
  
    } catch (error) {
      console.error('Error improving scene description with Gemini:', error);
      // Fallback to the original description on error
      return sceneDescription;
    }
  };
