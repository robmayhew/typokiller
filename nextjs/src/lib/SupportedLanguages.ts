export const supportedPatchLanguages = {
    TEXT:'Text',
    JAVASCRIPT:'JavaScript',
    JAVA:'Java'
} as const


export type PatchLanguage = typeof supportedPatchLanguages[keyof typeof supportedPatchLanguages];