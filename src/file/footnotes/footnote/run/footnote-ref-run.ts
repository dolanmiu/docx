import { Run } from "@file/paragraph";

import { FootnoteRef } from "./footnote-ref";

export class FootnoteRefRun extends Run {
    public constructor() {
        super({
            style: "FootnoteReference",
        });

        this.root.push(new FootnoteRef());
    }
}
