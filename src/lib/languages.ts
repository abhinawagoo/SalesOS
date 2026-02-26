export interface Language {
  code: string       // BCP-47 for SpeechRecognition
  label: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en-US', label: 'English',    flag: '🇺🇸' },
  { code: 'es-ES', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French',     flag: '🇫🇷' },
  { code: 'de-DE', label: 'German',     flag: '🇩🇪' },
  { code: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'hi-IN', label: 'Hindi',      flag: '🇮🇳' },
  { code: 'ja-JP', label: 'Japanese',   flag: '🇯🇵' },
  { code: 'zh-CN', label: 'Chinese',    flag: '🇨🇳' },
  { code: 'ar-SA', label: 'Arabic',     flag: '🇸🇦' },
]
