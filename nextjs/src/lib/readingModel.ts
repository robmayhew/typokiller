import {supportedPatchLanguages} from "@/lib/SupportedLanguages";
import {supportedReadModes} from "@/lib/SupportedReadModes";

export type Line = {
    lineNumber: number, lineTokens: Token[]
};

export type Token = {
    text: string,
    type: string,
    start: number,
    end: number,
    speechCharStart: number
}

function extractAdditions(patch: string): string {
    const lines = patch.split('\n')
    const additions: string[] = []

    for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            additions.push(line.slice(1)) // remove the leading '+'
        }
    }

    return additions.join('\n')
}


export interface ReadingModel {
    tokenize(content: string, mode: string): Line[]
}

export function fetchModel(language: string, mode:string):ReadingModel {
    switch (language) {
        case supportedPatchLanguages.JAVA:
            return new JavaModel();
        case supportedPatchLanguages.JAVASCRIPT:
            return new JavascriptModel();
    }
    return new TextModel();
}

export class TextModel implements ReadingModel {
    tokenize(content: string, mode:string): Line[] {
        if(mode === supportedReadModes.ADDITIONS_ONLY) {
            content = extractAdditions(content);
        }
        return this.tokenizeLines(content);
    }

    tokenizeLine(lineText: string): Token[] {
        const regex = /\w+|[^\s\w]/g;
        const tokens: Token[] = [];
        let match;

        while ((match = regex.exec(lineText)) !== null) {
            tokens.push({
                text: match[0],
                start: match.index,
                end: match.index + match[0].length,
                type:'data',
                speechCharStart:-1
            });
        }
        return tokens;
    }

    tokenizeLines(input: string): Line[] {
        const lines = input.split('\n');
        return lines.map((line, index) => ({
            lineNumber: index + 1, lineTokens: this.tokenizeLine(line)
        }));
    }

}

export class JavaModel extends TextModel {

}

export class JavascriptModel extends TextModel {

}

  