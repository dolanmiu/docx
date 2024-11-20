// See https://www.ecma-international.org/publications/standards/Ecma-376.htm (at Part 1, Page 1234)
import { Begin, End } from "@file/paragraph/run/field";

import { Run } from "../run";
import { PageReferenceFieldInstruction } from "./pageref-field-instruction";

// Options according to https://www.ecma-international.org/publications/standards/Ecma-376.htm (at Part 1, Page 1234)
export type IPageReferenceOptions = {
    /**
     * \h option - Creates a hyperlink to the bookmarked paragraph.
     */
    readonly hyperlink?: boolean;
    /**
     * \p option - Causes the field to display its position relative to the source
     *  bookmark. If the PAGEREF field is on the same page as the
     *  bookmark, it omits "on page #" and returns "above" or "below"
     *  only. If the PAGEREF field is not on the same page as the
     *  bookmark, the string "on page #" is used.
     */
    readonly useRelativePosition?: boolean;
};

export class PageReference extends Run {
    public constructor(bookmarkId: string, options: IPageReferenceOptions = {}) {
        super({
            children: [new Begin(true), new PageReferenceFieldInstruction(bookmarkId, options), new End()],
        });
    }
}
