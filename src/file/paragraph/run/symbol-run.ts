import { IRunOptions, Run } from "./run";
import { Symbol } from "./run-components/symbol";

export interface ISymbolRunOptions extends IRunOptions {
    readonly char: string;
    readonly symbolfont?: string;
}

export class SymbolRun extends Run {
    public constructor(options: ISymbolRunOptions | string) {
        if (typeof options === "string") {
            super({});
            this.root.push(new Symbol(options));
            return this;
        }

        super(options);
        this.root.push(new Symbol(options.char, options.symbolfont));
    }
}
