export function isPatchFile(content: string): boolean {
    const patchIndicators = [
      /^diff --git /m,
      /^Index: /m,
      /^--- .*?\n\+\+\+ /m
    ]
    return patchIndicators.some((regex) => regex.test(content))
  }