export const supportedReadModes = {
   ENTIRE_FILE: 'Entire File',
   ADDITIONS_ONLY: 'Additions Only'
} as const

export type ReadMode = typeof supportedReadModes[keyof typeof supportedReadModes]