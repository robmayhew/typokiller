import {supportedPatchLanguages} from "@/lib/SupportedLanguages";
import {supportedReadModes} from "@/lib/SupportedReadModes";



export type Line = {
    lineNumber: number, lineTokens: Token[]
};

export type Token = {
    text: string,
    replacement: string|null,
    spoken:boolean,
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

export function fetchModel(language: string, mode:string):TextModel {
    switch (language) {
        case supportedPatchLanguages.JAVA:
            return new JavaModel();
        case supportedPatchLanguages.JAVASCRIPT:
            return new JavascriptModel();
    }
    return new TextModel();
}

export class TextModel implements ReadingModel {
    private _lines: Line[] = [];


    tokenize(content: string, mode:string): Line[] {
        if(mode === supportedReadModes.ADDITIONS_ONLY) {
            content = extractAdditions(content);
        }
        this._lines = this.tokenizeLines(content);
        return this._lines;
    }

    tokenizeLine(lineText: string): Token[] {
        const regex = /\w+|[^\s\w]/g;
        const tokens: Token[] = [];
        let match;

        while ((match = regex.exec(lineText)) !== null) {
            tokens.push({
                spoken: false,
                replacement: "",
                text: match[0],
                start: match.index,
                end: match.index + match[0].length,
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

    nextSpokenToken(currentLine:number, currentToken:number)
    {
        const tokens = this._lines[currentLine].lineTokens;

        for(let i = 0; i < tokens.length; i++)
        {
            if(tokens[i].spoken && i > currentToken)
                return i;
        }
        return currentToken;
    }
}

export class JavaModel extends TextModel {
    tokenizeLine(lineText: string): Token[] {
        //const regex = /String|=|;|"|[A-Za-z0-9_]+/g;
        const regex = /String|=|;|\(|\)|"|\.|[A-Za-z0-9_]+/g;
        const result: Token[] = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(lineText)) !== null) {
            const tokenText = match[0];
            const start = match.index;
            const end = start + tokenText.length;
            const speechCharStart = -1;
            let replacement: string | null = null;
            let spoken = true;

            if (tokenText === '=') {
                replacement = 'equals';
            } else if (tokenText === '"'
                || tokenText === ';'
                || tokenText === '.'
                || tokenText === '('
                || tokenText === ')'
            ) {
                spoken = false;
            }

            result.push({ text: tokenText, replacement, spoken, start, end,speechCharStart });
        }
       return result;


        // const tokens = lineText.match(/String|=|;|"|[A-Za-z0-9_]+/g) || [];
        //
        //
        //
        //
        // const result:Token[] = tokens.map(tokenString => {
        //     if (tokenString === '=') {
        //         return { text: tokenString, replacement: 'equals', spoken: true };
        //     } else if (tokenString === '"' || tokenString === ';') {
        //         return { text: tokenString, replacement: null, spoken: false };
        //     } else {
        //         return { text: tokenString, replacement: null, spoken: true };
        //     }
        // });
        //
        // return result;
    }
}

export class JavascriptModel extends TextModel {

}

  