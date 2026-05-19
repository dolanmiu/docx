/**
 * SymbolRun module for WordprocessingML documents.
 *
 * This module provides support for inserting symbol characters into documents.
 *
 * @module
 */
import { type IRunOptions, Run } from "./run";
import { Symbol } from "./run-components/symbol";

/**
 * Options for creating a SymbolRun.
 *
 * @see {@link SymbolRun}
 */
export type ISymbolRunOptions = {
    /** The Unicode character code for the symbol */
    readonly char: string;
    /** The font to use for the symbol (e.g., "Wingdings", "Symbol") */
    readonly symbolfont?: string;
} & IRunOptions;

/**
 * Represents a symbol character in a WordprocessingML document.
 *
 * SymbolRun is used to insert special characters from symbol fonts.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new SymbolRun({
 *   char: "F04A",
 *   symbolfont: "Wingdings",
 * });
 * ```
 */
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
