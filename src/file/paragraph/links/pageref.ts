// See https://www.ecma-international.org/publications/standards/Ecma-376.htm (at Part 1, Page 1234)
import { Begin, End } from "file/paragraph/run/field";
import { Run } from "../run";
import { PageRefFieldInstruction } from "./pageref-field-instruction";
import type { IPageRefOptions } from "./pageref-properties";

export class PageRef extends Run {
    constructor(bookmarkId: string, options: IPageRefOptions = {}) {
        super({
            children: [new Begin(true), new PageRefFieldInstruction(bookmarkId, options), new End()],
        });
    }
}
