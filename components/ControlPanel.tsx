import React, { useRef, useEffect, useState } from 'react';
import type { Character, CinematicControls, StyleReference, SceneLocation, KeyObject } from '../types';
import { SHOT_TYPES, CAMERA_ANGLES, LIGHTING_OPTIONS, ASPECT_RATIOS, PHOTO_STYLES, CAMERA_ZOOMS, COLOR_TONES } from '../constants';
import { CustomSelect } from './CustomSelect';
import { Icon } from './Icon';
import { AspectRatioSelector } from './AspectRatioSelector';
import { ImageCountSelector } from './ImageCountSelector';
import { ImageUploader } from './ImageUploader';
import { LightingSelector } from './LightingSelector';

interface ControlPanelProps {
  characters: Character[];
  onCharacterUpdate: (index: number, character: Partial<Character>) => void;
  onAddCharacter: () => void;
  onRemoveCharacter: (index: number) => void;
  
  sceneDescription: string;
  onSceneDescriptionChange: (description: string) => void;
  useImprovedScene: boolean;
  onUseImprovedSceneChange: (value: boolean) => void;
  improvedSceneDescription: string;
  isImprovingScene: boolean;

  sceneLocation: SceneLocation;
  onSceneLocationChange: (location: SceneLocation) => void;
  
  keyObjects: KeyObject[];
  onKeyObjectUpdate: (index: number, object: Partial<Omit<KeyObject, 'id'>>) => void;
  onAddKeyObject: () => void;
  onRemoveKeyObject: (index: number) => void;

  styleReference: StyleReference;
  onStyleReferenceChange: (ref: StyleReference) => void;
  
  cinematicControls: CinematicControls;
  onCinematicControlsChange: (controls: CinematicControls) => void;
  maxImages: number;
  
  generatedPrompt: string;
  onGeneratedPromptChange: (prompt: string) => void;
  useCinematicPrompt: boolean;
  onUseCinematicPromptChange: (value: boolean) => void;

  onGenerate: () => void;
  isLoading: boolean;
}

const CollapsibleSection: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    isExpanded: boolean; 
    onToggle: () => void; 
    contentId: string;
    className?: string;
}> = ({ title, children, isExpanded, onToggle, contentId, className = '' }) => (
  <div className={`glass-panel rounded-xl shadow-lg transition-all duration-300 ${className}`}>
    <div
      className="flex justify-between items-center px-6 py-4 cursor-pointer group"
      onClick={onToggle}
      role="button"
      aria-expanded={isExpanded}
      aria-controls={contentId}
    >
      <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h2>
      <Icon path="M19.5 8.25l-7.5 7.5-7.5-7.5" className={`w-5 h-5 text-indigo-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
    </div>
    {isExpanded && (
      <div id={contentId} className="p-6 flex flex-col gap-4 border-t border-slate-200 animate-fade-in">
        {children}
      </div>
    )}
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const styleUploaderId = React.useId();
  const locationUploaderId = React.useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const [expandedSections, setExpandedSections] = React.useState({
    characters: true,
    sceneStyle: true,
    imageReference: false,
    keyObjects: false,
    cinematicControls: true,
    prompt: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyDescription = async () => {
    if (!props.sceneDescription) return;
    try {
        await navigator.clipboard.writeText(props.sceneDescription);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
  };
  
  const handleClearDescription = () => {
    props.onSceneDescriptionChange('');
  }

  const handleCharacterFileChange = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      props.onCharacterUpdate(index, { file, base64Data: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleStyleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      props.onStyleReferenceChange({
          ...props.styleReference,
          reference: { file, base64Data: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLocationFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      props.onSceneLocationChange({
          ...props.sceneLocation,
          reference: { file, base64Data: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleKeyObjectFileChange = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      props.onKeyObjectUpdate(index, {
        reference: { file, base64Data: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleControlChange = <K extends keyof CinematicControls>(key: K, value: CinematicControls[K]) => {
    props.onCinematicControlsChange({ ...props.cinematicControls, [key]: value });
  };
  
  const hasValidInputs = props.sceneDescription.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
      <CollapsibleSection
        title="Main Characters"
        isExpanded={expandedSections.characters}
        onToggle={() => toggleSection('characters')}
        contentId="characters-content"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {props.characters.map((char, index) => (
            <div key={char.id} className="p-4 bg-white/40 border border-white/60 rounded-lg flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <label htmlFor={`character-name-${index}`} className="text-sm font-medium text-indigo-700">Character {index + 1}</label>
                  {char.base64Data && (
                    <div className="animate-fade-in" title="Reference image uploaded">
                      <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-emerald-500"/>
                    </div>
                  )}
                </div>
                {props.characters.length > 1 && (
                  <button onClick={() => props.onRemoveCharacter(index)} className="text-rose-500 hover:text-rose-600">
                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.578 0a48.108 48.108 0 013.478-.397m7.5 0a48.667 48.667 0 00-7.5 0" className="w-5 h-5"/>
                  </button>
                )}
              </div>
              <input
                id={`character-name-${index}`}
                type="text"
                value={char.name}
                onChange={(e) => props.onCharacterUpdate(index, { name: e.target.value })}
                placeholder={`e.g., The Detective`}
                className="glass-input w-full rounded-lg py-2 px-3 focus:outline-none transition-all mb-3"
              />
              <ImageUploader 
                id={`character-upload-${char.id}`}
                base64Data={char.base64Data}
                onFileChange={(file) => handleCharacterFileChange(index, file)}
                onRemove={() => props.onCharacterUpdate(index, { file: null, base64Data: '' })}
              />
            </div>
          ))}
        </div>
        <button onClick={props.onAddCharacter} className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white/50 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 rounded-lg py-2 transition-all">
          + Add Character
        </button>
      </CollapsibleSection>

      <CollapsibleSection
        title="Your imagination"
        isExpanded={expandedSections.sceneStyle}
        onToggle={() => toggleSection('sceneStyle')}
        contentId="scene-style-content"
      >
        <div className="flex justify-between items-center">
            <label htmlFor="scene-description" className="text-sm font-medium text-indigo-700">Scene Description</label>
            <div className="flex items-center gap-2">
                {copyStatus === 'copied' && <span className="text-xs text-emerald-500 animate-fade-in">Copied!</span>}
                <button 
                    onClick={handleCopyDescription} 
                    className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white/60 rounded-md transition-colors disabled:text-slate-300 disabled:cursor-not-allowed" 
                    title="Copy" 
                    disabled={!props.sceneDescription}
                >
                    <Icon path="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5m-9 7.5h9A2.25 2.25 0 0018 12.75V9A2.25 2.25 0 0015.75 6.75h-7.5A2.25 2.25 0 006 9v3.75c0 1.24 1.01 2.25 2.25 2.25z" className="w-5 h-5"/>
                </button>
                <button 
                    onClick={handleClearDescription}
                    className="p-1.5 text-slate-400 hover:text-rose-500 bg-white/60 rounded-md transition-colors disabled:text-slate-300 disabled:cursor-not-allowed" 
                    title="Clear" 
                    disabled={!props.sceneDescription}
                >
                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.578 0a48.108 48.108 0 013.478-.397m7.5 0a48.667 48.667 0 00-7.5 0" className="w-5 h-5"/>
                </button>
            </div>
        </div>
        <textarea
            id="scene-description"
            ref={textareaRef}
            rows={4}
            value={props.sceneDescription}
            onChange={e => props.onSceneDescriptionChange(e.target.value)}
            placeholder="A detective on a rain-slicked street..."
            className="glass-input mt-2 w-full rounded-lg py-2 px-3 focus:outline-none transition-all duration-200 resize-none overflow-y-auto"
            style={{ minHeight: '8rem', maxHeight: '25rem' }}
        />
        <div className="flex justify-between items-center mt-4">
            <label htmlFor="improve-scene-toggle" className="block text-sm font-medium text-indigo-700">
                Automatic Cinematic Description
            </label>
            <label htmlFor="improve-scene-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={props.useImprovedScene}
                    onChange={() => props.onUseImprovedSceneChange(!props.useImprovedScene)}
                    id="improve-scene-toggle"
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-600 w-6">
                    {props.useImprovedScene ? 'On' : 'Off'}
                </span>
            </label>
        </div>
        {props.useImprovedScene && (
            <div className="relative min-h-[8rem] bg-white/40 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap mt-2">
                {props.isImprovingScene ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Improving...</span>
                        </div>
                    </div>
                ) : ( props.improvedSceneDescription || <span className="text-slate-400">Enter a description above to see the improved version.</span> )}
            </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Image Reference"
        isExpanded={expandedSections.imageReference}
        onToggle={() => toggleSection('imageReference')}
        contentId="image-reference-content"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="scene-location" className="text-sm font-medium text-indigo-700">Scene Location</label>
            <p className="text-xs text-slate-500 mb-2">Describe the location and/or provide a reference image.</p>
            <input id="scene-location" type="text" value={props.sceneLocation.text} onChange={e => props.onSceneLocationChange({ ...props.sceneLocation, text: e.target.value })} placeholder="e.g., A neon-lit alley in Neo-Tokyo, 2049" className="glass-input w-full rounded-lg py-2 px-3 focus:outline-none transition-all"/>
            <ImageUploader 
              id={locationUploaderId}
              base64Data={props.sceneLocation.reference.base64Data}
              onFileChange={handleLocationFileChange}
              onRemove={() => props.onSceneLocationChange({ ...props.sceneLocation, reference: { file: null, base64Data: '' } })}
            />
          </div>
          
          <div>
            <label htmlFor="style-reference-text" className="text-sm font-medium text-indigo-700">Style Reference</label>
            <p className="text-xs text-slate-500 mb-2">Describe the artistic style and/or provide a reference image.</p>
            <input
              id="style-reference-text"
              type="text"
              value={props.styleReference.text}
              onChange={e => props.onStyleReferenceChange({ ...props.styleReference, text: e.target.value })}
              placeholder="e.g., A vibrant oil painting"
              className="glass-input w-full rounded-lg py-2 px-3 focus:outline-none transition-all"
            />
            <ImageUploader
              id={styleUploaderId}
              base64Data={props.styleReference.reference.base64Data}
              onFileChange={handleStyleFileChange}
              onRemove={() => props.onStyleReferenceChange({ ...props.styleReference, reference: { file: null, base64Data: '' } })}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Key Objects & Props"
        isExpanded={expandedSections.keyObjects}
        onToggle={() => toggleSection('keyObjects')}
        contentId="key-objects-content"
      >
        <p className="text-xs text-slate-500 -mt-2 mb-2">Describe important objects or props in the scene. You can also provide a reference image for each.</p>
        <div className="flex flex-col gap-4">
          {props.keyObjects.map((obj, index) => (
            <div key={obj.id} className="p-4 bg-white/40 border border-white/60 rounded-lg flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center">
                <label htmlFor={`key-object-text-${index}`} className="text-sm font-medium text-indigo-700">Object {index + 1}</label>
                {props.keyObjects.length > 1 && (
                  <button onClick={() => props.onRemoveKeyObject(index)} className="text-rose-500 hover:text-rose-600">
                    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.578 0a48.108 48.108 0 013.478-.397m7.5 0a48.667 48.667 0 00-7.5 0" className="w-5 h-5"/>
                  </button>
                )}
              </div>
              <input
                id={`key-object-text-${index}`}
                type="text"
                value={obj.text}
                onChange={(e) => props.onKeyObjectUpdate(index, { text: e.target.value })}
                placeholder={`e.g., A glowing briefcase`}
                className="glass-input w-full rounded-lg py-2 px-3 focus:outline-none transition-all"
              />
              <ImageUploader 
                id={`key-object-upload-${obj.id}`}
                base64Data={obj.reference.base64Data}
                onFileChange={(file) => handleKeyObjectFileChange(index, file)}
                onRemove={() => props.onKeyObjectUpdate(index, { reference: { file: null, base64Data: '' } })}
              />
            </div>
          ))}
        </div>
        <button onClick={props.onAddKeyObject} className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-white/50 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 rounded-lg py-2 transition-all mt-2">
          + Add Object
        </button>
      </CollapsibleSection>

      <CollapsibleSection
        title="Cinematic Controls"
        isExpanded={expandedSections.cinematicControls}
        onToggle={() => toggleSection('cinematicControls')}
        contentId="cinematic-controls-content"
      >
        <div className="flex flex-col gap-4">
          <AspectRatioSelector label="Aspect Ratio" value={props.cinematicControls.aspectRatio} options={ASPECT_RATIOS} onChange={(v) => handleControlChange('aspectRatio', v)} />
          <ImageCountSelector label="Number of Images" value={props.cinematicControls.numberOfImages} max={props.maxImages} onChange={(v) => handleControlChange('numberOfImages', v)} />
          <LightingSelector label="Lighting Style" value={props.cinematicControls.lighting} options={LIGHTING_OPTIONS} onChange={(v) => handleControlChange('lighting', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect label="Photo Style" id="photo-style" value={props.cinematicControls.photoStyle} options={PHOTO_STYLES} onChange={(v) => handleControlChange('photoStyle', v)} />
            <CustomSelect label="Camera Zoom" id="camera-zoom" value={props.cinematicControls.cameraZoom} options={CAMERA_ZOOMS} onChange={(v) => handleControlChange('cameraZoom', v)} />
            <CustomSelect label="Camera Perspective" id="camera-angle" value={props.cinematicControls.cameraAngle} options={CAMERA_ANGLES} onChange={(v) => handleControlChange('cameraAngle', v)} />
            <CustomSelect label="Shot Type" id="shot-type" value={props.cinematicControls.shotType} options={SHOT_TYPES} onChange={(v) => handleControlChange('shotType', v)} />
            <CustomSelect label="Color & Tone" id="color-tone" value={props.cinematicControls.colorTone} options={COLOR_TONES} onChange={(v) => handleControlChange('colorTone', v)} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Generated Cinematic Prompt"
        isExpanded={expandedSections.prompt}
        onToggle={() => toggleSection('prompt')}
        contentId="generated-prompt-content"
      >
        <div className="flex justify-between items-center mb-3">
            <label htmlFor="cinematic-prompt-toggle" className="block text-sm font-medium text-indigo-700">
                Generated Cinematic Prompt
            </label>
            <label htmlFor="cinematic-prompt-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={props.useCinematicPrompt}
                    onChange={() => props.onUseCinematicPromptChange(!props.useCinematicPrompt)}
                    id="cinematic-prompt-toggle"
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-600 w-6">
                    {props.useCinematicPrompt ? 'On' : 'Off'}
                </span>
            </label>
        </div>
        
        {props.useCinematicPrompt && (
          <>
            <p className="text-xs text-slate-500 -mt-2 mb-2">
              This prompt is automatically generated from your settings. You can edit it directly before generating the scene.
            </p>
            <textarea
              value={props.generatedPrompt}
              onChange={(e) => props.onGeneratedPromptChange(e.target.value)}
              rows={8}
              className="text-xs text-slate-700 bg-white/50 p-4 rounded-lg font-mono w-full h-64 whitespace-pre-wrap border border-indigo-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              aria-label="Generated cinematic prompt, editable"
            />
          </>
        )}
      </CollapsibleSection>
      
      <div className="mt-auto sticky bottom-0 z-20">
        <button
          onClick={props.onGenerate}
          disabled={props.isLoading || !hasValidInputs}
          className={
            props.isLoading
              ? "w-full flex items-center justify-center gap-3 text-lg text-white font-bold py-3 px-4 rounded-lg loading-shimmer cursor-wait shadow-lg"
              : "w-full flex items-center justify-center gap-3 text-lg bg-gradient-to-r from-orange-500 via-purple-600 to-violet-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-500 ease-in-out transform bg-[length:200%_200%] bg-[position:0%_50%] enabled:hover:bg-[position:100%_50%] focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/30"
          }
        >
          {props.isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l.813 2.846a4.5 4.5 0 003.09 3.09L24 18.75l-1.846.813a4.5 4.5 0 00-3.09 3.09L18.25 24l-.813-2.846a4.5 4.5 0 00-3.09-3.09L12.5 18.75l1.846-.813a4.5 4.5 0 003.09-3.09L18.25 12zM12.5 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L18.25 9l-1.846.813a4.5 4.5 0 00-3.09 3.09L12.5 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l1.846-.813a4.5 4.5 0 003.09-3.09L12.5 2.25z" className="w-5 h-5" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
};