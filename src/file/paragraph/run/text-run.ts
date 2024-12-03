import { IRunOptions, Run } from "./run";

export class TextRun extends Run {
    public constructor(options: IRunOptions | string) {
        super(typeof options === "string" ? { text: options } : options);
    }
}
