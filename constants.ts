import type { ShotType, CameraAngle, Lighting, CinematicControls, AspectRatio, PhotoStyle, CameraZoom, ColorTone } from './types';

export const SHOT_TYPES: Readonly<ShotType[]> = ['None', 'Extreme Close Up', 'Close Up', 'Medium Shot', 'Full Shot', 'Long Shot', 'Establishing Shot'];
export const CAMERA_ANGLES: Readonly<CameraAngle[]> = ['None', 'Eye Level', 'High Angle', 'Low Angle', 'Dutch Angle', "Bird's Eye View"];
export const CAMERA_ZOOMS: Readonly<CameraZoom[]> = ['None', 'Close Up', 'Medium', 'Wide Angle', 'Super Wide Angle'];
export const LIGHTING_OPTIONS: Readonly<Lighting[]> = ['None', 'Cinematic', 'Film Noir', 'Natural Light', 'Morning Natural Light', 'Bright Daylight', 'Sunset / Golden Hour', 'Blue Hour', 'Night Cinematic', 'High Key', 'Low Key', 'Horror Dim Light', 'Neon Cyberpunk', 'Candlelight / Firelight', 'Flashlight / Dramatic'];
export const ASPECT_RATIOS: Readonly<AspectRatio[]> = ['16:9', '1:1', '9:16', '4:3', '3:4'];
export const PHOTO_STYLES: Readonly<PhotoStyle[]> = ['None', 'Photorealistic', 'Hyper-realistic', 'Cinematic Portrait', 'Digital Painting', 'Concept Art', 'Gritty Documentary', 'Ethereal Fantasy', '80s Retro Film', 'Anime Key Visual'];
export const COLOR_TONES: Readonly<ColorTone[]> = ['None', 'Vibrant & Saturated', 'Muted & Desaturated', 'Warm & Nostalgic', 'Cool & Moody', 'Black & White', 'High Contrast'];

export const DEFAULT_CINEMATIC_CONTROLS: CinematicControls = {
  shotType: 'None',
  cameraAngle: 'None',
  cameraZoom: 'None',
  lighting: 'Cinematic',
  aspectRatio: '16:9',
  photoStyle: 'Photorealistic',
  colorTone: 'None',
  numberOfImages: 1,
};