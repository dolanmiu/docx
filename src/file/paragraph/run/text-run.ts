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
}
