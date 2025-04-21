export const supportedPatchLanguages = {
    JAVASCRIPT:'JavaScript',
    JAVA:'Java'
} as const


export type PatchLanguage = typeof supportedPatchLanguages[keyof typeof supportedPatchLanguages];