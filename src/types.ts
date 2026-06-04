export interface TextElement {
  id: string;
  type: 'text';
  x: number; // percentage (0-100) or pixel value. Let's use relative offset (pixels relative to 450x700 viewport)
  y: number;
  width: number;
  height: number;
  rotate: number; // degrees (-180 to 180)
  content: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold' | '300' | '500' | '700';
  textAlign: 'left' | 'center' | 'right';
  bgColor?: string; // e.g. transparent or rounded badge style
  borderRadius?: number;
  padding?: number;
  link?: string; // clickable target
  animation?: 'fade' | 'bounce' | 'slide' | 'zoom' | 'none';
}

export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number; // degrees
  src: string; // url or upload path
  borderRadius?: number;
  link?: string; // clickable target
  animation?: 'fade' | 'bounce' | 'slide' | 'zoom' | 'none';
}

export interface VideoElement {
  id: string;
  type: 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  src: string; // url or upload path
  borderRadius?: number;
}

export interface AudioElement {
  id: string;
  type: 'audio';
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  src: string; // audio track url or upload path
  isPlaying?: boolean;
  visualStyle?: 'cassette' | 'vinyl' | 'speaker' | 'minimal';
  caption?: string;
}

export type CardElement = TextElement | ImageElement | VideoElement | AudioElement;

export interface Card {
  id: string;
  name: string; // Friend's name associated (e.g. "Arun", "Meena")
  code: string; // Enter code (e.g. "ARUN99", "SWEETMEENA") -- case insensitive
  createdAt: number;
  bgType: 'color' | 'gradient' | 'image';
  bgColor: string; // bg color or gradient css or background image src
  elements: CardElement[];
  bgMusicEnabled: boolean;
  bgMusicUrl?: string; // background track
  personalNote?: string; // primary thank you note (optional auxiliary field)
  isDeleted?: boolean;
}
