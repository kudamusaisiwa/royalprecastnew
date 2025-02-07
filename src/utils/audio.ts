// Audio notification sounds
const POSITIVE_SOUND_URL = "https://res.cloudinary.com/fresh-ideas/video/upload/v1731771010/c0wtehzaqeteeusekr7i.mp3";
const NEGATIVE_SOUND_URL = "https://res.cloudinary.com/fresh-ideas/video/upload/v1731771016/gncafbedldir4lye8ijf.mp3";

const audioCache = new Map<string, HTMLAudioElement>();

const getAudio = (url: string): HTMLAudioElement => {
  if (!audioCache.has(url)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache.set(url, audio);
  }
  return audioCache.get(url)!;
};

export const playPositiveSound = () => {
  const audio = getAudio(POSITIVE_SOUND_URL);
  audio.currentTime = 0;
  audio.play().catch(console.error);
};

export const playNegativeSound = () => {
  const audio = getAudio(NEGATIVE_SOUND_URL);
  audio.currentTime = 0;
  audio.play().catch(console.error);
};