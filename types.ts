export interface Character {
  id: string;
  name: string;
  file: File | null;
  base64Data: string;
}

export interface ImageReference {
    file: File | null;
    base64Data: string;
}

export interface StyleReference {
  text: string;
  reference: ImageReference;
}

export interface KeyObject {
  id: string;
  text: string;
  reference: ImageReference;
}

export interface SceneLocation {
  text: string;
  reference: ImageReference;
}

export type ShotType = 'None' | 'Extreme Close Up' | 'Close Up' | 'Medium Shot' | 'Full Shot' | 'Long Shot' | 'Establishing Shot';
export type CameraAngle = 'None' | 'Eye Level' | 'High Angle' | 'Low Angle' | 'Dutch Angle' | "Bird's Eye View";
export type CameraZoom = 'None' | 'Close Up' | 'Medium' | 'Wide Angle' | 'Super Wide Angle';
export type Lighting = 'None' | 'Cinematic' | 'Film Noir' | 'Natural Light' | 'Morning Natural Light' | 'Bright Daylight' | 'Sunset / Golden Hour' | 'Blue Hour' | 'Night Cinematic' | 'High Key' | 'Low Key' | 'Horror Dim Light' | 'Neon Cyberpunk' | 'Candlelight / Firelight' | 'Flashlight / Dramatic';
export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4';
export type PhotoStyle = 'None' | 'Photorealistic' | 'Hyper-realistic' | 'Cinematic Portrait' | 'Digital Painting' | 'Concept Art' | 'Gritty Documentary' | 'Ethereal Fantasy' | '80s Retro Film' | 'Anime Key Visual';
export type ColorTone = 'None' | 'Vibrant & Saturated' | 'Muted & Desaturated' | 'Warm & Nostalgic' | 'Cool & Moody' | 'Black & White' | 'High Contrast';

export interface CinematicControls {
  shotType: ShotType;
  cameraAngle: CameraAngle; // Renamed to Camera Perspective in UI
  cameraZoom: CameraZoom;
  lighting: Lighting; // Renamed to Lighting Style in UI
  aspectRatio: AspectRatio;
  photoStyle: PhotoStyle;
  colorTone: ColorTone;
  numberOfImages: number;
}

export interface ImagePayload {
    base64Data: string;
    mimeType: string;
}

export interface GenerationPayload {
    prompt: string;
    images: ImagePayload[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  payload: GenerationPayload;
  upscaled?: boolean;
  cinematicControls?: CinematicControls;
  editPrompt?: string;
  improvedEditPrompt?: string;
}