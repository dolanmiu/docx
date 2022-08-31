import { IRunOptions, Run } from "./run";
import { Text } from "./run-components/text";

export class TextRun extends Run {
    public constructor(options: IRunOptions | string) {
        if (typeof options === "string") {
            super({});
            this.root.push(new Text(options));
            return this;
        }

        super(options);
    }
}
