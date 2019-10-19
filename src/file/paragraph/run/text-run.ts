import { FootnoteReferenceRun } from "file/footnotes/footnote/run/reference-run";
import { IRunOptions, Run } from "./run";
import { Text } from "./run-components/text";

export interface ITextRunOptions extends IRunOptions {
    readonly text: string;
}

export class TextRun extends Run {
    constructor(options: ITextRunOptions | string) {
        if (typeof options === "string") {
            super({});
            this.root.push(new Text(options));
            return;
        }

        super(options);
        this.root.push(new Text(options.text));
    }

    public referenceFootnote(id: number): TextRun {
        this.root.push(new FootnoteReferenceRun(id));
        return this;
    }
}
