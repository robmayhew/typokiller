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
    speechCharStart: number,
    whiteSpace: boolean
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
                spoken: true,
                replacement: "",
                text: match[0],
                start: match.index,
                end: match.index + match[0].length,
                speechCharStart:-1,
                whiteSpace:false
            });
        }
        return tokens;
    }

    tokenizeLines(input: string): Line[] {
        const lines = input.split('\n');
        return lines.map((line, index) => {
            return{ lineNumber: index + 1, lineTokens: this.tokenizeLine(line)}
        });

    }

    nextSpokenToken(currentLine:number, currentToken:number)
    {
        const tokens = this._lines[currentLine].lineTokens;
        console.log(`Current line ${currentLine} currentToken ${currentToken}`)
        for(let i = 0; i < tokens.length; i++)
        {
            console.log(`Spoken ${tokens[i].spoken} i = ${i}`);
            if(tokens[i].spoken && i > currentToken)
                return i;
        }
        console.log('Returning curren token');
        return currentToken;
    }
}

export class JavaModel extends TextModel {
    tokenizeLine(lineText: string): Token[] {
        //const regex = /String|=|;|"|[A-Za-z0-9_]+/g;
        const regex = /String|=|\/|\\|;|\(|\)|"|\.|\s+|[A-Za-z0-9_]+/g;
        const result: Token[] = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(lineText)) !== null) {
            const tokenText = match[0];
            const start = match.index;
            const end = start + tokenText.length;
            const speechCharStart = -1;
            let replacement: string | null = null;
            let spoken = true;
            let whiteSpace = false;

            if(/\s+/.test(tokenText))
            {
                spoken = false;
                whiteSpace = true;
            }
            else if (tokenText === '=') {
                replacement = 'equals';

            } else if (tokenText === '"'
                || tokenText === ';'
                || tokenText === '.'
                || tokenText === '('
                || tokenText === ')'
                || tokenText === '/'
                || tokenText === '\\'
            ) {
                spoken = false;
            }

            if(whiteSpace)
            {
                if(result.length ==0 || (!result[result.length-1].whiteSpace))
                {
                    result.push({ text: tokenText, replacement, spoken, start, end,speechCharStart, whiteSpace });
                }
            }else{
                result.push({ text: tokenText, replacement, spoken, start, end,speechCharStart, whiteSpace });
            }
        }
       return result;
    }
}

export class JavascriptModel extends TextModel {

}

  