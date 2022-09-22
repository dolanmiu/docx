// See https://www.ecma-international.org/publications/standards/Ecma-376.htm (at Part 1, Page 1234)
import { Begin, End } from "@file/paragraph/run/field";
import { Run } from "../run";
import { PageReferenceFieldInstruction } from "./pageref-field-instruction";
import type { IPageReferenceOptions } from "./pageref-properties";

export class PageReference extends Run {
    public constructor(bookmarkId: string, options: IPageReferenceOptions = {}) {
        super({
            children: [new Begin(true), new PageReferenceFieldInstruction(bookmarkId, options), new End()],
        });
    }
}
