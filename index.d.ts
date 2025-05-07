declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.webp'
declare module '*.ico'
declare module '*.bmp'

// Add these if you're also using other asset types
declare module '*.mp3'
declare module '*.wav'
declare module '*.mp4'
declare module '*.webm'

// For JSON imports
declare module '*.json' {
  const value: any
  export default value
}