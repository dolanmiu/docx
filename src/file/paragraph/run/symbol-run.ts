import { IRunOptions, Run } from "./run";
import { Symbol } from "./run-components/symbol";

export type ISymbolRunOptions = {
    readonly char: string;
    readonly symbolfont?: string;
} & IRunOptions;

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
