import { IRunOptions, Run } from "./run";
export interface ISymbolRunOptions extends IRunOptions {
    readonly char: string;
    readonly symbolfont?: string;
}
export declare class SymbolRun extends Run {
    constructor(options: ISymbolRunOptions | string);
}
