
import React, { useState, useEffect, useId, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Gallery } from './components/Gallery';
import { generateStoryImage, improveEditPrompt, improveSceneDescription } from './services/geminiService';
import type { 
  Character, 
  CinematicControls, 
  GeneratedImage, 
  StyleReference, 
  GenerationPayload, 
  SceneLocation, 
  KeyObject,
  ShotType,
  CameraAngle,
  CameraZoom,
  Lighting,
  PhotoStyle,
  AspectRatio,
  ColorTone,
  ImageReference,
} from './types';
import { DEFAULT_CINEMATIC_CONTROLS } from './constants';
import { Icon } from './components/Icon';
import { ImageUploader } from './components/ImageUploader';
import { SubscriptionGate } from './components/SubscriptionGate';
import { MaskingCanvas } from './components/MaskingCanvas';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper mappings for dynamic prompt generation
const shotTypeDescriptions: Record<ShotType, string> = {
    'None': '', // Not used in prompt directly
    'Extreme Close Up': 'An extreme close-up, focusing on a specific detail like the eyes or an object to create a strong focal point.',
    'Close Up': 'A tight close-up shot, capturing the character\'s face to emphasize their expressions and feelings.',
    'Medium Shot': 'A classic medium shot from the waist up, balancing the character with their surrounding environment.',
    'Full Shot': 'A full shot, showing the character from head to toe, giving a clear view of their posture and action within the scene.',
    'Long Shot': 'A long shot, where the character is visible but the focus is on the environment, establishing scale and location.',
    'Establishing Shot': 'A wide establishing shot that shows the overall location and sets the mood for the scene before focusing on any characters.'
};

const cameraAngleDescriptions: Record<CameraAngle, string> = {
    'None': '', // Not used in prompt directly
    'Eye Level': 'A neutral eye-level angle, creating a direct and relatable connection with the character.',
    'High Angle': 'A high-angle shot, looking down on the subject, providing a broader view of the scene or creating a sense of scale.',
    'Low Angle': 'A low-angle shot, looking up at the subject to make them appear prominent or significant in the scene.',
    'Dutch Angle': 'A dynamic Dutch angle, tilting the camera to create a stylized and energetic feel.',
    "Bird's Eye View": 'An omniscient bird\'s eye view from directly overhead, offering a unique, map-like perspective of the scene.'
};

const cameraZoomDescriptions: Record<CameraZoom, string> = {
    'None': '', // Not used in prompt directly
    'Close Up': 'A telephoto lens effect, compressing the background and creating a tight focus on the subject.',
    'Medium': 'A standard lens effect, mimicking the natural perspective of the human eye.',
    'Wide Angle': 'A wide-angle lens effect, capturing a broad field of view with some perspective distortion.',
    'Super Wide Angle': 'An ultra-wide or fisheye lens effect, creating a vast, distorted perspective for a dramatic, immersive feel.'
};

const lightingDescriptions: Record<Lighting, string> = {
    'None': '', // Not used in prompt directly
    'Cinematic': 'Classic three-point cinematic lighting with a key light, fill light, and backlight to create depth and dimension.',
    'Film Noir': 'High-contrast Film Noir lighting with distinct shadows (chiaroscuro) for a dramatic and stylized mood.',
    'Natural Light': 'Soft, diffused natural light, as if from a window or an overcast day, creating a realistic and gentle feel.',
    'Morning Natural Light': 'Crisp, cool morning light with long shadows, evoking a sense of new beginnings or quiet solitude.',
    'Bright Daylight': 'Bright midday sun creating clear highlights and shadows, perfect for vibrant or energetic scenes.',
    'Sunset / Golden Hour': 'Warm, magical Golden Hour lighting during sunset, casting a soft, flattering glow and creating a romantic or nostalgic atmosphere.',
    'Blue Hour': 'Ethereal Blue Hour lighting, occurring just before sunrise or after sunset, with a cool, serene, and moody blue tone.',
    'Night Cinematic': 'A cinematic night scene, lit by practical lights like street lamps or moonlight, with deep blacks and pockets of illumination.',
    'High Key': 'Bright, optimistic high-key lighting with minimal shadows, often used in comedies or lighthearted settings.',
    'Low Key': 'Dramatic low-key lighting with pronounced shadows, creating atmosphere, mystery, or intimacy.',
    'Horror Dim Light': 'Atmospheric, dim lighting, using selective light sources (like a flashlight) to build suspense and focus attention.',
    'Neon Cyberpunk': 'Vibrant neon and holographic lights of a futuristic city, creating a high-tech and imaginative atmosphere.',
    'Candlelight / Firelight': 'Warm, flickering candlelight or firelight, creating an intimate, historic, or classic atmosphere with soft shadows.',
    'Flashlight / Dramatic': 'A dramatic, focused beam from a flashlight, cutting through darkness to highlight a subject or create focus.'
};

const photoStyleDescriptions: Record<PhotoStyle, string> = {
    'None': '', // Not used in prompt directly
    'Photorealistic': 'Achieve absolute photorealism. The final image should look like a photograph taken with a high-end DSLR camera. Focus on realistic skin textures, lighting, and materials.',
    'Hyper-realistic': 'Push beyond standard photography into hyper-realism. Every detail, from skin pores to fabric threads, must be rendered with extreme, microscopic clarity and precision.',
    'Cinematic Portrait': 'A cinematic portrait style with shallow depth of field (bokeh), dramatic lighting, and a focus on the character\'s emotion, while maintaining photographic realism.',
    'Digital Painting': 'A beautiful digital painting style, with visible brushstrokes and an artistic, illustrative quality.',
    'Concept Art': 'The style of professional concept art, focusing on world-building, atmosphere, and visual storytelling for films or games.',
    'Gritty Documentary': 'A candid, in-the-moment documentary style, suggesting an authentic, unfiltered snapshot of reality, with naturalistic lighting and film grain.',
    'Ethereal Fantasy': 'An ethereal fantasy style with soft, glowing light, magical elements, and a dreamlike, otherworldly feel.',
    '80s Retro Film': 'The nostalgic look of an 80s retro film, with characteristic grain, lens flares, and a warm, analog color palette.',
    'Anime Key Visual': 'The polished, dynamic style of an anime key visual, with sharp lines, vibrant colors, and dramatic composition.'
};

const colorToneDescriptions: Record<ColorTone, string> = {
    'None': '', // Not used in prompt directly
    'Vibrant & Saturated': 'Apply a vibrant color grade with rich, saturated colors to make the scene feel energetic and vivid.',
    'Muted & Desaturated': 'Use a muted, desaturated color palette to create a gritty, somber, or serious atmosphere.',
    'Warm & Nostalgic': 'Grade the image with warm, golden tones (like sepia or orange/teal) to evoke a sense of nostalgia, memory, or comfort.',
    'Cool & Moody': 'Implement a cool color grade using blues, cyans, and greens to create a moody, mysterious, or futuristic feeling.',
    'Black & White': 'Render the image in high-contrast black and white for a classic, dramatic, and timeless look.',
    'High Contrast': 'Create a punchy, high-contrast look with deep blacks and bright highlights for a bold and dramatic visual style.'
};

const aspectRatioExamples: Record<AspectRatio, string> = {
    '16:9': 'a widescreen format (e.g., 1920x1080)',
    '1:1': 'a square format (e.g., 1080x1080)',
    '9:16': 'a vertical format (e.g., 1080x1920)',
    '4:3': 'a standard format (e.g., 1024x768)',
    '3:4': 'a vertical portrait format (e.g., 768x1024)',
};

const generatePrompt = (
    { characters, sceneDescription, sceneLocation, keyObjects, styleReference, cinematicControls }:
    { characters: Character[], sceneDescription: string, sceneLocation: SceneLocation, keyObjects: KeyObject[], styleReference: StyleReference, cinematicControls: CinematicControls }
) => {
    const characterFiles = characters.filter(c => c.file);
    let imageIndex = 0;

    const buildReferenceString = (text: string, hasFile: boolean, fileType: string): [string, number] => {
        let output = text || `Not specified.`;
        let newIndex = imageIndex;
        if (hasFile) {
            newIndex++;
            output += (text ? ' ' : '') + `The ${fileType} should be heavily inspired by [Reference Image ${newIndex}].`;
        }
        return [output, newIndex];
    };
    
    const { shotType, cameraAngle, cameraZoom, lighting, aspectRatio, photoStyle, colorTone } = cinematicControls;
    
    const shotTypeLine = shotType === 'None'
        ? '- **Shot Type:** The AI can choose the most appropriate framing for the scene.'
        : `- **Shot Type:** ${shotType}. ${shotTypeDescriptions[shotType]}`;

    const cameraAngleLine = cameraAngle === 'None'
        ? '- **Camera Perspective:** The AI can choose the most fitting camera angle.'
        : `- **Camera Perspective:** ${cameraAngle}. ${cameraAngleDescriptions[cameraAngle]}`;

    const cameraZoomLine = cameraZoom === 'None'
        ? '- **Camera Zoom:** The AI can determine the optimal lens for composition.'
        : `- **Camera Zoom:** Use a ${cameraZoom} lens effect. ${cameraZoomDescriptions[cameraZoom]}`;
        
    const lightingLine = lighting === 'None'
        ? "- **Lighting Style:** The AI can select the most suitable lighting to match the scene's mood."
        : `- **Lighting Style:** The scene should be illuminated with a ${lighting} style. ${lightingDescriptions[lighting]}`;

    const photoStyleLine = photoStyle === 'None'
        ? '- **Photo Aesthetics:** The AI will determine the best artistic style for the image.'
        : `- **Photo Aesthetics:** Render the image with a ${photoStyle} look. ${photoStyleDescriptions[photoStyle]}`;
    
    const colorToneLine = colorTone === 'None'
        ? '- **Color & Tone:** The AI should choose the most appropriate color grading for the mood.'
        : `- **Color & Tone:** ${colorTone}. ${colorToneDescriptions[colorTone]}`;


    // Intelligent Prompt Generation: Use a more professional prompt for 3+ characters
    if (characterFiles.length >= 3) {
        const characterManifest = characterFiles.map((c, i) => {
            imageIndex++;
            return `- **Character #${i + 1} ("${c.name}"):** Portrayed in [Reference Image ${imageIndex}]. Please capture their likeness with high fidelity.`;
        }).join('\n');

        const [styleOutput, idx1] = buildReferenceString(styleReference.text, !!styleReference.reference.file, 'visual style, mood, and color palette');
        imageIndex = idx1;
        const [locationOutput, idx2] = buildReferenceString(sceneLocation.text, !!sceneLocation.reference.file, 'location');
        imageIndex = idx2;

        const keyObjectsDescriptions = keyObjects
            .filter(ko => ko.text.trim() !== '' || ko.reference.file)
            .map(ko => {
                let description = `- ${ko.text || 'An object'}`;
                if (ko.reference.file) {
                    imageIndex++;
                    description += ` based on the appearance in [Reference Image ${imageIndex}].`;
                }
                return description;
            })
            .join('\n');

        return `**Director's Brief: A Cinematic Ensemble Scene**

**Vision:** The goal is to craft a single, compelling image that brings together ${characterFiles.length} distinct individuals into one cohesive and atmospheric scene. The final piece should feel like a keyframe from a film, rich with narrative potential.

**The Cast:**
We have a cast of ${characterFiles.length} characters. It's crucial that each character's unique identity, as shown in their reference image, is preserved with high fidelity. Let's introduce them:
${characterManifest}

**Scene & Setting:**
- **The Moment:** ${sceneDescription} (This is the central action or mood. All characters should be part of this moment.)
- **The World:** ${locationOutput}
- **Props & Details:**
${keyObjectsDescriptions || '- The scene is focused on the characters and their interaction.'}
- **Art Direction:** ${styleOutput}

**Cinematography & Composition:**
- We're aiming for a composition that feels natural and balanced, giving each character their space while connecting them to the overall scene. Consider using depth (foreground, mid-ground, background) to create a dynamic arrangement.
- The lighting and shadows should be unified, enveloping all characters consistently within the environment's mood.

**Technical Blueprint:**
- **Frame:** The final image should have a precise ${aspectRatio} aspect ratio (${aspectRatioExamples[aspectRatio]}).
${shotTypeLine}
${cameraAngleLine}
${cameraZoomLine}
${lightingLine}
${photoStyleLine}
${colorToneLine}

**Final Check:** The finished image should be a masterful composition that successfully integrates all ${characterFiles.length} characters, honoring their individual appearances while creating a unified and evocative narrative moment.`;

    } else {
        // Original prompt logic for 0-2 characters
        const characterDescriptions = characterFiles.map((c, i) => {
            imageIndex++;
            return `- [Reference Image ${imageIndex}] shows "${c.name}". Please faithfully recreate their facial features and likeness to ensure they are clearly recognizable.`;
        }).join('\n');

        const [styleOutput, idx1] = buildReferenceString(styleReference.text, !!styleReference.reference.file, 'visual style, mood, and color palette');
        imageIndex = idx1;
        const [locationOutput, idx2] = buildReferenceString(sceneLocation.text, !!sceneLocation.reference.file, 'location');
        imageIndex = idx2;

        const keyObjectsDescriptions = keyObjects
            .filter(ko => ko.text.trim() !== '' || ko.reference.file)
            .map(ko => {
                let description = `- ${ko.text || 'An object'}`;
                if (ko.reference.file) {
                    imageIndex++;
                    description += ` based on the appearance in [Reference Image ${imageIndex}].`;
                }
                return description;
            })
            .join('\n');
            
        return `**Creative Brief: Generate a Safe-for-Work Cinematic Scene**

**Main Goal:** Create a single, high-quality, photorealistic image that places the provided characters into a new, detailed scene.

**Top Priority: Character Likeness**
It is essential to accurately represent the characters from their reference images. Please pay close attention to their facial features, hair, and overall appearance to ensure they are clearly recognizable. This is the most important part of the request.
${characterDescriptions || '- No specific characters provided.'}

**Scene Construction Details:**
- **Core Scene Idea:** ${sceneDescription}
- **Location:** ${locationOutput}
- **Key Objects/Props:**
${keyObjectsDescriptions || '- No specific objects needed.'}
- **Artistic Style Reference:** ${styleOutput}

**Cinematic & Technical Specifications:**
- **Image Aspect Ratio:** The final image should have a precise ${aspectRatio} aspect ratio (${aspectRatioExamples[aspectRatio]}).
${shotTypeLine}
${cameraAngleLine}
${cameraZoomLine}
${lightingLine}
${photoStyleLine}
${colorToneLine}

**Final Instructions:**
- Focus on creating a cohesive and believable image where the characters are naturally integrated into the environment.
- Ensure the final output is realistic, high-quality, and adheres to all safety guidelines.
- The output must be a single image, not a collage.`;
    }
};

/**
 * Generates a concise, keyword-driven prompt suitable for the imagen-4.0-generate-001 model.
 */
const generateImagenPrompt = (
    { sceneDescription, sceneLocation, keyObjects, styleReference, cinematicControls }:
    { sceneDescription: string, sceneLocation: SceneLocation, keyObjects: KeyObject[], styleReference: StyleReference, cinematicControls: CinematicControls }
): string => {
    const parts = [];

    // Core description is the most important part
    parts.push(sceneDescription);

    // Style and aesthetic keywords
    const styleParts = [];
    if (cinematicControls.photoStyle && cinematicControls.photoStyle !== 'None') {
        const styleKeywords: Record<PhotoStyle, string> = {
            'None': '',
            'Photorealistic': 'photorealistic photograph, high-end DSLR camera photo',
            'Hyper-realistic': 'hyper-realistic, extreme detail, 8k',
            'Cinematic Portrait': 'cinematic portrait, shallow depth of field, bokeh, dramatic lighting',
            'Digital Painting': 'digital painting, illustrative, detailed brushstrokes',
            'Concept Art': 'concept art, atmospheric, world-building style',
            'Gritty Documentary': 'gritty documentary photo, candid, naturalistic lighting, film grain',
            'Ethereal Fantasy': 'ethereal fantasy, soft glowing light, magical, dreamlike',
            '80s Retro Film': '80s retro film photo, analog color palette, lens flares, film grain',
            'Anime Key Visual': 'anime key visual style, vibrant colors, sharp lines, dynamic composition'
        };
        styleParts.push(styleKeywords[cinematicControls.photoStyle]);
    }
    if (styleReference.text) {
        styleParts.push(`in the style of ${styleReference.text}`);
    }
    if (styleParts.length > 0) {
        parts.push(styleParts.join(', '));
    }
    
    // Add other details as keywords
    if (sceneLocation.text) {
        parts.push(sceneLocation.text);
    }
    
    const keyObjectTexts = keyObjects.map(ko => ko.text).filter(Boolean);
    if (keyObjectTexts.length > 0) {
        parts.push(`featuring: ${keyObjectTexts.join(', ')}`);
    }

    if (cinematicControls.shotType !== 'None') {
        parts.push(cinematicControls.shotType);
    }
    if (cinematicControls.cameraAngle !== 'None') {
        parts.push(cinematicControls.cameraAngle);
    }
    if (cinematicControls.cameraZoom !== 'None') {
        parts.push(cinematicControls.cameraZoom);
    }
    if (cinematicControls.lighting && cinematicControls.lighting !== 'None') {
        parts.push(`${cinematicControls.lighting} lighting`);
    }
    if (cinematicControls.colorTone && cinematicControls.colorTone !== 'None') {
        const colorKeywords: Record<ColorTone, string> = {
            'None': '',
            'Vibrant & Saturated': 'vibrant, saturated colors',
            'Muted & Desaturated': 'muted, desaturated color palette',
            'Warm & Nostalgic': 'warm golden tones, nostalgic color grading',
            'Cool & Moody': 'cool blue tones, moody color grading',
            'Black & White': 'black and white, monochrome',
            'High Contrast': 'high contrast, punchy colors'
        };
        parts.push(colorKeywords[cinematicControls.colorTone]);
    }

    // Final prompt assembly, comma-separated for clarity
    return parts.join(', ');
};

const cinematicControlLabels: Record<keyof Omit<CinematicControls, 'aspectRatio' | 'numberOfImages'>, string> = {
    shotType: 'Shot Type',
    cameraAngle: 'Camera Perspective',
    cameraZoom: 'Camera Zoom',
    lighting: 'Lighting Style',
    photoStyle: 'Photo Style',
    colorTone: 'Color & Tone',
};

const RizunaLogo = () => (
  <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-sm flex-shrink-0">
    <defs>
      <linearGradient id="orange-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    
    {/* Main Play Shape (Orange) */}
    <path d="M15 20 C15 10 25 10 30 15 L85 45 C90 50 90 60 85 65 L30 95 C25 98 15 95 15 85 V20 Z" fill="url(#orange-grad)" />
    
    {/* Film Strip Holes (White) */}
    <circle cx="25" cy="25" r="3" fill="white" fillOpacity="0.9" />
    <circle cx="40" cy="32" r="3" fill="white" fillOpacity="0.9" />
    <circle cx="55" cy="40" r="3" fill="white" fillOpacity="0.9" />
    <circle cx="70" cy="48" r="3" fill="white" fillOpacity="0.9" />

    {/* Film Reel Center */}
    <circle cx="45" cy="65" r="12" fill="white" fillOpacity="0.9" />
    <circle cx="45" cy="65" r="3" fill="#EA580C" />
    <circle cx="45" cy="58" r="1.5" fill="#EA580C" />
    <circle cx="52" cy="65" r="1.5" fill="#EA580C" />
    <circle cx="45" cy="72" r="1.5" fill="#EA580C" />
    <circle cx="38" cy="65" r="1.5" fill="#EA580C" />
    
    {/* Blue Strip (Film) */}
    <path d="M15 85 L85 65 L80 80 L20 100 Z" fill="#1E293B" />
    <path d="M25 95 L30 93 M40 90 L45 88 M55 85 L60 83 M70 80 L75 78" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>

    {/* Treble Clef (Music) - Dark Blue */}
    <path d="M85 90 C75 100 100 90 95 65 C92 50 85 50 90 35 C92 30 98 30 98 35 C98 45 92 50 92 65 C92 75 85 80 82 75" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle cx="82" cy="75" r="3" fill="#1E293B" />
    
    {/* Microphone (Small, top) */}
    <rect x="60" y="10" width="10" height="14" rx="4" fill="#94A3B8" transform="rotate(30 65 17)" />
    <path d="M60 18 Q65 22 70 18" stroke="#64748B" strokeWidth="1" fill="none" transform="rotate(30 65 17)" />
  </svg>
);

const App: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([
    { id: `char-${Date.now()}-1`, name: 'Character 1', file: null, base64Data: '' },
    { id: `char-${Date.now()}-2`, name: 'Character 2', file: null, base64Data: '' }
  ]);
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [sceneLocation, setSceneLocation] = useState<SceneLocation>({ text: '', reference: { file: null, base64Data: '' } });
  const [styleReference, setStyleReference] = useState<StyleReference>({ text: '', reference: { file: null, base64Data: '' } });
  const [keyObjects, setKeyObjects] = useState<KeyObject[]>([
    { id: `ko-${Date.now()}`, text: '', reference: { file: null, base64Data: '' } }
  ]);
  
  const [cinematicControls, setCinematicControls] = useState<CinematicControls>(DEFAULT_CINEMATIC_CONTROLS);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loadingOperations, setLoadingOperations] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [imageDetails, setImageDetails] = useState<{ dimensions: string; size: string } | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editReferenceImage, setEditReferenceImage] = useState<ImageReference>({ file: null, base64Data: '' });
  
  // State for masking tool
  const [editMask, setEditMask] = useState<string | null>(null);
  const [showMaskEditor, setShowMaskEditor] = useState<boolean>(false);
  const [maskBrushSize, setMaskBrushSize] = useState<number>(30);
  const [isMaskErasing, setIsMaskErasing] = useState<boolean>(false);
  const [maskClearTrigger, setMaskClearTrigger] = useState(0);

  const [improvedEditPrompt, setImprovedEditPrompt] = useState<string>('');
  const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
  const [useImprovedPrompt, setUseImprovedPrompt] = useState<boolean>(true);
  const [useCinematicPrompt, setUseCinematicPrompt] = useState<boolean>(true);
  const [activeModalTab, setActiveModalTab] = useState<'studio' | 'edit' | 'details'>('studio');
  const [useImprovedScene, setUseImprovedScene] = useState<boolean>(false);
  const [improvedSceneDescription, setImprovedSceneDescription] = useState<string>('');
  const [isImprovingScene, setIsImprovingScene] = useState<boolean>(false);
  const editUploaderId = useId();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unlockedStatus = localStorage.getItem('isAppUnlocked');
    if (unlockedStatus === 'true') {
        setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleMouseMove = (e: MouseEvent) => {
        const { left, top } = header.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        header.style.setProperty('--mouse-x', `${x}px`);
        header.style.setProperty('--mouse-y', `${y}px`);
    };

    header.addEventListener('mousemove', handleMouseMove);

    return () => {
        header.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleUnlock = () => {
      localStorage.setItem('isAppUnlocked', 'true');
      setIsUnlocked(true);
  };

  const viewingImage = viewingImageIndex !== null ? generatedImages[viewingImageIndex] : null;

  const hasCharacterReference = characters.some(c => c.file);
  const maxImages = 4;

  useEffect(() => {
    if (cinematicControls.numberOfImages > maxImages) {
      setCinematicControls(prev => ({ ...prev, numberOfImages: maxImages }));
    }
  }, [cinematicControls.numberOfImages, maxImages]);

  // Debounced effect for improving the scene description
  useEffect(() => {
    if (!useImprovedScene) {
      setImprovedSceneDescription('');
      setIsImprovingScene(false);
      return;
    }

    if (!sceneDescription.trim()) {
      setImprovedSceneDescription('');
      return;
    }

    const handler = setTimeout(() => {
        const generate = async () => {
            if (!useImprovedScene) return;
            setIsImprovingScene(true);
            try {
                const improved = await improveSceneDescription(sceneDescription, hasCharacterReference);
                setImprovedSceneDescription(improved);
            } catch (e) {
                console.error("Failed to improve scene:", e);
                setImprovedSceneDescription(sceneDescription); 
            } finally {
                setIsImprovingScene(false);
            }
        };
        generate();
    }, 800);

    return () => {
        clearTimeout(handler);
    };
  }, [sceneDescription, useImprovedScene, hasCharacterReference]);
  
  const effectiveSceneDescription = useImprovedScene && improvedSceneDescription ? improvedSceneDescription : sceneDescription;

  useEffect(() => {
    const newPrompt = generatePrompt({
      characters,
      sceneDescription: effectiveSceneDescription,
      sceneLocation,
      keyObjects,
      styleReference,
      cinematicControls,
    });
    setGeneratedPrompt(newPrompt);
  }, [characters, effectiveSceneDescription, sceneLocation, keyObjects, styleReference, cinematicControls]);

  useEffect(() => {
    if (viewingImage) {
      const img = new Image();
      img.onload = () => {
        const dimensions = `${img.naturalWidth} x ${img.naturalHeight}px`;
        const base64 = viewingImage.url.split(',')[1];
        const bytes = Math.ceil(base64.length / 4) * 3;
        let size: string;
        if (bytes < 1024) {
          size = `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
          size = `${(bytes / 1024).toFixed(1)} KB`;
        } else {
          size = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        setImageDetails({ dimensions, size });
      };
      img.onerror = () => {
        setImageDetails({ dimensions: 'Unknown', size: 'Unknown' });
      }
      img.src = viewingImage.url;
    } else {
      setImageDetails(null);
    }
  }, [viewingImage]);

    // Debounced effect for improving the edit prompt
    useEffect(() => {
        if (!useImprovedPrompt) {
            setImprovedEditPrompt('');
            setIsImprovingPrompt(false);
            return;
        }

        if (!editPrompt.trim()) {
            setImprovedEditPrompt('');
            return;
        }

        const handler = setTimeout(() => {
            const generate = async () => {
                if (!useImprovedPrompt) return; // Re-check in case toggle changed during timeout
                setIsImprovingPrompt(true);
                try {
                    const hasReference = !!editReferenceImage.base64Data;
                    const hasMask = !!editMask;
                    const newImprovedPrompt = await improveEditPrompt(editPrompt, hasReference, hasMask);
                    setImprovedEditPrompt(newImprovedPrompt);
                } catch (e) {
                    console.error("Failed to improve prompt:", e);
                    setImprovedEditPrompt(editPrompt); 
                } finally {
                    setIsImprovingPrompt(false);
                }
            };
            generate();
        }, 800);

        return () => {
            clearTimeout(handler);
        };
    }, [editPrompt, editReferenceImage.base64Data, editMask, useImprovedPrompt]);

    const closeViewer = () => {
        setViewingImageIndex(null);
        setEditPrompt('');
        setImprovedEditPrompt('');
        setEditReferenceImage({ file: null, base64Data: '' });
        // Reset mask state
        setEditMask(null);
        setShowMaskEditor(false);
        setIsMaskErasing(false);
        setMaskBrushSize(30);
        setActiveModalTab('studio');
    };

    const handleNextImage = () => {
      if (viewingImageIndex !== null && generatedImages.length > 1) {
        setViewingImageIndex((prevIndex) => (prevIndex! + 1) % generatedImages.length);
      }
    };

    const handlePrevImage = () => {
      if (viewingImageIndex !== null && generatedImages.length > 1) {
        setViewingImageIndex((prevIndex) => (prevIndex! - 1 + generatedImages.length) % generatedImages.length);
      }
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (viewingImageIndex === null) return;
        if (e.key === 'ArrowRight') {
          handleNextImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevImage();
        } else if (e.key === 'Escape') {
          closeViewer();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [viewingImageIndex, generatedImages]);

  const handleAddCharacter = () => {
    setCharacters(prev => [...prev, { id: `char-${Date.now()}`, name: `Character ${prev.length + 1}`, file: null, base64Data: '' }]);
  };

  const handleRemoveCharacter = (index: number) => {
    setCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const handleCharacterUpdate = (index: number, updatedCharacter: Partial<Character>) => {
    setCharacters(prev => prev.map((char, i) => i === index ? { ...char, ...updatedCharacter } : char));
  };
  
  const handleAddKeyObject = () => {
    setKeyObjects(prev => [...prev, { id: `ko-${Date.now()}`, text: '', reference: { file: null, base64Data: '' } }]);
  };

  const handleRemoveKeyObject = (index: number) => {
    setKeyObjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyObjectUpdate = (index: number, updatedObject: Partial<Omit<KeyObject, 'id'>>) => {
    setKeyObjects(prev => prev.map((obj, i) => i === index ? { ...obj, ...updatedObject } : obj));
  };

  const handleDownloadFromUrl = (url: string) => {
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    const filename = `rizuna-ai-${timestamp}.png`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!effectiveSceneDescription.trim()) return;

    setLoadingOperations(p => p + 1);
    setError(null);

    try {
      const imagesToUpload = [];
      const characterFiles = characters.filter(c => c.file);
      for (const char of characterFiles) {
        if(char.file) {
            const base64Data = await fileToBase64(char.file);
            imagesToUpload.push({ base64Data, mimeType: char.file.type });
        }
      }
      if (styleReference.reference.file) {
        const base64Data = await fileToBase64(styleReference.reference.file);
        imagesToUpload.push({ base64Data, mimeType: styleReference.reference.file.type });
      }

      if (sceneLocation.reference.file) {
        const base64Data = await fileToBase64(sceneLocation.reference.file);
        imagesToUpload.push({ base64Data, mimeType: sceneLocation.reference.file.type });
      }

      for (const ko of keyObjects) {
        if (ko.reference.file) {
          const base64Data = await fileToBase64(ko.reference.file);
          imagesToUpload.push({ base64Data, mimeType: ko.reference.file.type });
        }
      }

      const hasImages = imagesToUpload.length > 0;
      let promptForApi: string;

      if (useCinematicPrompt) {
        promptForApi = hasImages
          ? generatedPrompt
          : generateImagenPrompt({
              sceneDescription: effectiveSceneDescription,
              sceneLocation,
              keyObjects,
              styleReference,
              cinematicControls,
            });
      } else {
        promptForApi = effectiveSceneDescription;
      }

      const payload: GenerationPayload = { prompt: promptForApi, images: imagesToUpload };
      
      const results = await generateStoryImage(payload, cinematicControls);
      
      const newImages: GeneratedImage[] = results.map((result, i) => ({
        id: `${new Date().toISOString()}-batch-${i}`,
        url: result.imageUrl,
        prompt: result.prompt,
        payload: result.payload,
        cinematicControls: cinematicControls,
      }));

      setGeneratedImages((prev) => [...newImages, ...prev]);
        
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoadingOperations(p => p - 1);
    }
  };

  const handleRegenerate = async (imageToRegenerate: GeneratedImage) => {
    setLoadingOperations(p => p + 1);
    setError(null);
    try {
      const controlsForRegen = {
        ...(imageToRegenerate.cinematicControls || DEFAULT_CINEMATIC_CONTROLS),
        numberOfImages: 1,
      };

      const results = await generateStoryImage(
        imageToRegenerate.payload,
        controlsForRegen
      );

      if (results.length > 0) {
        const { imageUrl, prompt, payload: returnedPayload } = results[0];
        const newImage: GeneratedImage = {
          id: `${new Date().toISOString()}-regen`,
          url: imageUrl,
          prompt,
          payload: returnedPayload,
          cinematicControls: imageToRegenerate.cinematicControls,
        };
        setGeneratedImages((prev) => [newImage, ...prev]);
      } else {
        throw new Error('Regeneration failed to produce an image.');
      }
    } catch (err)      {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoadingOperations(p => p - 1);
    }
  };

  const handleUpscale = async (imageToUpscale: GeneratedImage) => {
    setLoadingOperations(p => p + 1);
    setError(null);
    try {
        const upscalePrompt = `${imageToUpscale.prompt}\n\n**UPSCALE INSTRUCTION:** Re-generate this image at the highest possible resolution and with maximum detail, clarity, and texture. Enhance all elements to create a superior, high-fidelity version.`;
        
        const upscalePayload: GenerationPayload = {
            ...imageToUpscale.payload,
            prompt: upscalePrompt,
        };

        const controlsForUpscale = {
            ...(imageToUpscale.cinematicControls || DEFAULT_CINEMATIC_CONTROLS),
            numberOfImages: 1,
        };

        const results = await generateStoryImage(
            upscalePayload,
            controlsForUpscale
        );

        if (results.length > 0) {
            const { imageUrl, payload: returnedPayload } = results[0];
            const newImage: GeneratedImage = {
                id: `${new Date().toISOString()}-upscaled`,
                url: imageUrl,
                prompt: upscalePrompt,
                payload: returnedPayload,
                upscaled: true,
                cinematicControls: imageToUpscale.cinematicControls,
            };
            setGeneratedImages((prev) => [newImage, ...prev]);
        } else {
            throw new Error('Upscaling failed to produce an image.');
        }
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during upscaling.');
        }
    } finally {
      setLoadingOperations(p => p - 1);
    }
  };

  const handleRemoveBackground = async (imageToRemoveBg: GeneratedImage) => {
    setLoadingOperations(p => p + 1);
    setError(null);
    try {
        const removeBgPrompt = `**Critical Task: Background Removal.** Your only job is to perfectly cut out the main subject(s) from the provided image. The background must be completely removed and made transparent. The final output MUST be a PNG image with a transparent alpha channel. Do not add any new elements or change the subject.`;
        
        const [header, base64Data] = imageToRemoveBg.url.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

        const removeBgPayload: GenerationPayload = {
            prompt: removeBgPrompt,
            images: [{ base64Data, mimeType }],
        };
        
        const controlsForBgRemoval = {
            ...(imageToRemoveBg.cinematicControls || DEFAULT_CINEMATIC_CONTROLS),
            numberOfImages: 1,
        };

        const results = await generateStoryImage(
            removeBgPayload,
            controlsForBgRemoval
        );
        
        if (results.length > 0) {
            const { imageUrl, payload: returnedPayload } = results[0];
            const newImage: GeneratedImage = {
                id: `${new Date().toISOString()}-no-bg`,
                url: imageUrl,
                prompt: removeBgPrompt,
                payload: returnedPayload,
                cinematicControls: imageToRemoveBg.cinematicControls,
            };
            setGeneratedImages((prev) => [newImage, ...prev]);
        } else {
            throw new Error('Background removal failed to produce an image.');
        }
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred while removing the background.');
        }
    } finally {
      setLoadingOperations(p => p - 1);
    }
  };

  const handleEditImage = async (
      imageToEdit: GeneratedImage, 
      userPrompt: string, 
      finalPrompt: string,
      referenceImage: ImageReference,
      maskImage: string | null
  ) => {
    if (!finalPrompt.trim()) return;
    setLoadingOperations(p => p + 1);
    setError(null);
    try {
        const [header, base64Data] = imageToEdit.url.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        const imagesForPayload = [{ base64Data, mimeType }];
        
        let editInstructionPrompt = finalPrompt;

        if (maskImage) {
            const [, maskBase64Data] = maskImage.split(',');
            imagesForPayload.push({ base64Data: maskBase64Data, mimeType: 'image/png' });
            if (!finalPrompt.toLowerCase().includes('mask')) {
                editInstructionPrompt = `**Task: Masked Image Editing**\nPlease use the second image (the black and white mask) to perform a targeted edit on the first image (the original). The white area of the mask indicates the precise region to modify. Apply the following instruction ONLY within this masked area, leaving the black areas of the mask completely untouched: "${finalPrompt}".`;
            }
        }

        if (referenceImage.base64Data && referenceImage.file) {
            const [refHeader, refBase64Data] = referenceImage.base64Data.split(',');
            const refMimeType = refHeader.match(/:(.*?);/)?.[1] || referenceImage.file.type;
            imagesForPayload.push({ base64Data: refBase64Data, mimeType: refMimeType });
            if (!finalPrompt.toLowerCase().includes('reference image')) {
                const imageCount = imagesForPayload.length;
                editInstructionPrompt = `${editInstructionPrompt}\nUse the ${imageCount === 2 ? 'second' : 'third'} image as a style/content reference for the edit.`
            }
        }
        
        if (!useImprovedPrompt && !maskImage) {
             if (!finalPrompt.toLowerCase().includes('edit')) {
                 editInstructionPrompt = `**Task: Image Editing**\nPlease apply the following instruction to the provided image: "${finalPrompt}"`;
             }
        }

        const editPayload: GenerationPayload = {
            prompt: editInstructionPrompt,
            images: imagesForPayload,
        };

        const controlsForEdit = {
            ...(imageToEdit.cinematicControls || DEFAULT_CINEMATIC_CONTROLS),
            numberOfImages: 1,
        };

        const results = await generateStoryImage(
            editPayload,
            controlsForEdit
        );

        if (results.length > 0) {
            const { imageUrl, payload: returnedPayload } = results[0];
            const newImage: GeneratedImage = {
                id: `${new Date().toISOString()}-edited`,
                url: imageUrl,
                prompt: returnedPayload.prompt,
                payload: returnedPayload,
                editPrompt: userPrompt,
                improvedEditPrompt: finalPrompt,
                cinematicControls: imageToEdit.cinematicControls,
            };
            setGeneratedImages((prev) => [newImage, ...prev]);
        } else {
            throw new Error('Image edit failed to produce a result.');
        }
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during the image edit.');
        }
    } finally {
      setLoadingOperations(p => p - 1);
    }
  };
  
  const handleModalAction = (action: (arg: any) => void, arg: any) => {
    if (!viewingImage) return;
    closeViewer();
    action(arg);
  };

  const handleEditReferenceFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        setEditReferenceImage({ file, base64Data: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleModalEditAction = () => {
    const promptToUse = useImprovedPrompt
        ? (improvedEditPrompt.trim() ? improvedEditPrompt : editPrompt)
        : editPrompt;
        
    if (!viewingImage || !promptToUse.trim()) return;

    const imageToEdit = viewingImage;
    const userPrompt = editPrompt;
    const currentRefImage = editReferenceImage;
    const finalPrompt = promptToUse;
    const currentMask = editMask;

    closeViewer();
    handleEditImage(imageToEdit, userPrompt, finalPrompt, currentRefImage, currentMask);
  };

  const handleUseImprovedSceneChange = (value: boolean) => {
    setUseImprovedScene(value);
    if (value) {
      setUseCinematicPrompt(false);
    }
  };

  const ActionButton: React.FC<{ onClick: () => void; iconPath: string; children: React.ReactNode; }> = ({ onClick, iconPath, children }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white/60 border border-white/80 rounded-lg transition-all duration-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transform hover:scale-[1.02] shadow-sm"
    >
      <Icon path={iconPath} className="w-5 h-5" />
      <span>{children}</span>
    </button>
  );

  const ModalTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; iconPath: string; }> = ({ active, onClick, children, iconPath }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
        active 
          ? 'bg-white/80 border-indigo-500 text-indigo-700' 
          : 'bg-transparent border-transparent text-slate-500 hover:bg-white/50 hover:text-slate-700'
      }`}
    >
      <Icon path={iconPath} className="w-5 h-5" />
      {children}
    </button>
  );

  if (!isUnlocked) {
    return <SubscriptionGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header ref={headerRef} className="group relative overflow-hidden bg-white/40 backdrop-blur-xl border-b border-white/60 p-4 shadow-sm sticky top-0 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(249,115,22,0.1),transparent_40%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        
        {/* Animated Border on Hover */}
        <div 
            className="absolute bottom-0 left-0 w-full h-px bg-[length:300%_100%] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ animation: 'border-shimmer 4s linear infinite' }}
        />

        <div className="relative container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <RizunaLogo />
                <div>
                    <p className="font-subtitle text-[10px] uppercase tracking-wider text-slate-500 leading-none mb-0.5 ml-0.5">For media</p>
                    <h1 className="font-header text-3xl font-bold tracking-tight text-slate-800 leading-none">Rizuna</h1>
                </div>
            </div>
            
            <div className="flex items-center justify-start sm:justify-end flex-wrap gap-2 sm:gap-4">
              {/* Social Links and Text Only */}
              <span className="text-slate-500 text-sm font-medium">Designed by Rizuna Team</span>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        <div className="lg:col-span-1">
          <ControlPanel
            characters={characters}
            onCharacterUpdate={handleCharacterUpdate}
            onAddCharacter={handleAddCharacter}
            onRemoveCharacter={handleRemoveCharacter}
            sceneDescription={sceneDescription}
            onSceneDescriptionChange={setSceneDescription}
            useImprovedScene={useImprovedScene}
            onUseImprovedSceneChange={handleUseImprovedSceneChange}
            improvedSceneDescription={improvedSceneDescription}
            isImprovingScene={isImprovingScene}
            sceneLocation={sceneLocation}
            onSceneLocationChange={setSceneLocation}
            keyObjects={keyObjects}
            onKeyObjectUpdate={handleKeyObjectUpdate}
            onAddKeyObject={handleAddKeyObject}
            onRemoveKeyObject={handleRemoveKeyObject}
            styleReference={styleReference}
            onStyleReferenceChange={setStyleReference}
            cinematicControls={cinematicControls}
            onCinematicControlsChange={setCinematicControls}
            maxImages={maxImages}
            generatedPrompt={generatedPrompt}
            onGeneratedPromptChange={setGeneratedPrompt}
            useCinematicPrompt={useCinematicPrompt}
            onUseCinematicPromptChange={setUseCinematicPrompt}
            onGenerate={handleGenerate}
            isLoading={loadingOperations > 0}
          />
        </div>
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg relative mb-6 backdrop-blur-md shadow-sm" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 hover:text-rose-900">
                <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>
          )}
          <Gallery 
            images={generatedImages} 
            isLoading={loadingOperations > 0} 
            generatingCount={loadingOperations > 0 ? cinematicControls.numberOfImages : 0}
            onViewImage={setViewingImageIndex} 
            onRegenerate={handleRegenerate}
            onUpscale={handleUpscale}
          />
        </div>
      </main>

      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-lg" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0" onClick={closeViewer} aria-hidden="true"></div>
          
          <button 
              onClick={closeViewer} 
              className="absolute top-4 right-4 z-[51] p-2 text-slate-500 bg-white/80 rounded-full transition-all duration-200 hover:bg-rose-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-lg"
              aria-label="Close viewer"
          >
              <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>

          <div className="relative flex flex-col md:flex-row items-start justify-center w-full h-full max-w-7xl max-h-full p-4 md:p-8 animate-materialize">

            <div className="flex-1 flex flex-col items-center justify-center w-full md:w-auto h-2/3 md:h-full relative">
                <img 
                    src={viewingImage.url} 
                    alt="Generated scene" 
                    className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-slate-400/50 ${showMaskEditor ? 'invisible' : ''}`}
                />
                {showMaskEditor && viewingImage && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <MaskingCanvas
                            imageUrl={viewingImage.url}
                            onMaskChange={setEditMask}
                            brushSize={maskBrushSize}
                            isErasing={isMaskErasing}
                            clearTrigger={maskClearTrigger}
                        />
                    </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-full border border-white/60 shadow-lg">
                    <button onClick={handlePrevImage} disabled={generatedImages.length <= 1} className="p-2 text-slate-600 rounded-full hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Icon path="M15.75 19.5L8.25 12l7.5-7.5" className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">
                        {viewingImageIndex! + 1} / {generatedImages.length}
                    </span>
                    <button onClick={handleNextImage} disabled={generatedImages.length <= 1} className="p-2 text-slate-600 rounded-full hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative flex-shrink-0 w-full md:w-96 md:max-w-md h-1/3 md:h-full glass-panel rounded-2xl shadow-2xl mt-4 md:mt-0 md:ml-8 flex flex-col">
              <div className="flex-shrink-0 flex border-b border-slate-200">
                  <ModalTabButton active={activeModalTab === 'studio'} onClick={() => setActiveModalTab('studio')} iconPath="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l.813 2.846a4.5 4.5 0 003.09 3.09L24 18.75l-1.846.813a4.5 4.5 0 00-3.09 3.09L18.25 24l-.813-2.846a4.5 4.5 0 00-3.09-3.09L12.5 18.75l1.846-.813a4.5 4.5 0 003.09-3.09L18.25 12zM12.5 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L18.25 9l-1.846.813a4.5 4.5 0 00-3.09 3.09L12.5 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l1.846-.813a4.5 4.5 0 003.09-3.09L12.5 2.25z">Studio</ModalTabButton>
                  <ModalTabButton active={activeModalTab === 'edit'} onClick={() => setActiveModalTab('edit')} iconPath="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.781a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10">Edit</ModalTabButton>
                  <ModalTabButton active={activeModalTab === 'details'} onClick={() => setActiveModalTab('details')} iconPath="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z">Details</ModalTabButton>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {activeModalTab === 'studio' && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Image Studio</h3>
                    <ActionButton onClick={() => handleModalAction(handleRegenerate, viewingImage)} iconPath="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l.813 2.846a4.5 4.5 0 003.09 3.09L24 18.75l-1.846.813a4.5 4.5 0 00-3.09 3.09L18.25 24l-.813-2.846a4.5 4.5 0 00-3.09-3.09L12.5 18.75l1.846-.813a4.5 4.5 0 003.09-3.09L18.25 12zM12.5 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L18.25 9l-1.846.813a4.5 4.5 0 00-3.09 3.09L12.5 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l1.846-.813a4.5 4.5 0 003.09-3.09L12.5 2.25z">Regenerate</ActionButton>
                    <ActionButton onClick={() => handleModalAction(handleUpscale, viewingImage)} iconPath="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6l-5.25 5.25">Upscale Image</ActionButton>
                    <ActionButton onClick={() => handleModalAction(handleRemoveBackground, viewingImage)} iconPath="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.655-3.388m1.655 3.388a15.998 15.998 0 013.388 1.62m-3.388-1.62a15.998 15.998 0 00-1.655 3.388m-1.655-3.388a15.998 15.998 0 00-3.388-1.62m-5.043-.025a15.998 15.998 0 01-1.655-3.388m-1.655 3.388a15.998 15.998 0 01-3.388 1.62m13.532 2.276a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.655-3.388m1.655 3.388a15.998 15.998 0 013.388 1.62M12 6.38a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z">Remove Background</ActionButton>
                    <ActionButton onClick={() => handleDownloadFromUrl(viewingImage.url)} iconPath="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3">Download</ActionButton>
                  </div>
                )}
                {activeModalTab === 'edit' && (
                  <div className="flex flex-col gap-4 h-full">
                    <h3 className="text-lg font-bold text-slate-800">Edit Image</h3>
                    <div>
                      <label htmlFor="edit-prompt" className="block text-sm font-medium text-indigo-700 mb-2">Edit Instruction</label>
                      <textarea id="edit-prompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g., Change the background to a futuristic city" rows={2} className="glass-input w-full rounded-lg py-2 px-3 focus:outline-none transition-all"/>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-indigo-700 mb-2">Reference Image (Optional)</label>
                      <ImageUploader id={editUploaderId} base64Data={editReferenceImage.base64Data} onFileChange={handleEditReferenceFileChange} onRemove={() => setEditReferenceImage({ file: null, base64Data: '' })} isCompact />
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                        <button 
                            onClick={() => setShowMaskEditor(!showMaskEditor)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white/60 border border-slate-300 rounded-lg transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-500"
                        >
                            <Icon path="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-5 h-5"/>
                            {showMaskEditor ? 'Hide Mask Editor' : 'Mask Image Area'}
                        </button>
                    </div>
                    {showMaskEditor && (
                        <div className="flex flex-col gap-3 p-3 bg-slate-100/50 border border-slate-300 rounded-lg animate-fade-in flex-grow min-h-0">
                            <p className="text-xs text-slate-500 flex-shrink-0">Paint over the area you want to edit.</p>
                            <div className="flex items-center gap-4 flex-shrink-0 pt-2">
                                <div className="flex-1">
                                    <label htmlFor="brush-size" className="text-xs text-indigo-700">Brush Size: {maskBrushSize}</label>
                                    <input id="brush-size" type="range" min="5" max="100" value={maskBrushSize} onChange={e => setMaskBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsMaskErasing(false)} className={`p-2 rounded-md transition-colors ${!isMaskErasing ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`} title="Brush">
                                        <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => setIsMaskErasing(true)} className={`p-2 rounded-md transition-colors ${isMaskErasing ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`} title="Eraser">
                                        <Icon path="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                                    </button>
                                     <button onClick={() => setMaskClearTrigger(c => c+1)} className={`p-2 rounded-md bg-white text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600`} title="Clear Mask">
                                        <Icon path="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                        <label htmlFor="improve-prompt-toggle" className="block text-sm font-medium text-indigo-700">
                            Automatic Improved Prompt
                        </label>
                        <label htmlFor="improve-prompt-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useImprovedPrompt}
                                onChange={() => setUseImprovedPrompt(!useImprovedPrompt)}
                                id="improve-prompt-toggle"
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-600 w-6">
                                {useImprovedPrompt ? 'On' : 'Off'}
                            </span>
                        </label>
                    </div>
                    {useImprovedPrompt && (
                      <div className="relative min-h-[6rem] bg-slate-100/50 border border-slate-300 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap">
                        {isImprovingPrompt ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                            <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          </div>
                        ) : ( improvedEditPrompt || <span className="text-slate-400">The improved prompt will appear here.</span> )}
                      </div>
                    )}
                    <div className="mt-auto">
                        <button
                          onClick={handleModalEditAction}
                          disabled={!editPrompt.trim() || loadingOperations > 0}
                          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                        >
                            <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.781a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-5 h-5"/>
                            Apply Edit
                        </button>
                    </div>
                  </div>
                )}
                {activeModalTab === 'details' && (
                  <div className="text-slate-600 text-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Cinematic Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-indigo-700">Dimensions</p>
                        <p className="bg-slate-100 p-2 rounded-md text-slate-800 border border-slate-200">{imageDetails?.dimensions || 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-700">File Size</p>
                        <p className="bg-slate-100 p-2 rounded-md text-slate-800 border border-slate-200">{imageDetails?.size || 'Loading...'}</p>
                      </div>
                      
                      {viewingImage.cinematicControls && Object.entries(viewingImage.cinematicControls)
                        .filter(([key, value]) => key in cinematicControlLabels && value !== 'None')
                        .map(([key, value]) => (
                            <div key={key}>
                                <p className="font-semibold text-indigo-700 mb-1">{cinematicControlLabels[key as keyof typeof cinematicControlLabels]}</p>
                                <p className="bg-slate-100 p-2 rounded-md text-slate-800 border border-slate-200">{String(value)}</p>
                            </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      <footer className="bg-white/60 backdrop-blur-md border-t border-white/60 p-6 text-center text-sm text-slate-500">
          <p className="mb-2">&copy; {new Date().getFullYear()} Rizuna AI. Built for creators.</p>
          <p className="text-xs">Rizuna Media Team</p>
      </footer>
    </div>
  );
};

export default App;
