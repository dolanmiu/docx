import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { IPageReferenceOptions } from "./pageref";
import { TextAttributes } from "../run/text-attributes";

export class PageReferenceFieldInstruction extends XmlComponent {
    public constructor(bookmarkId: string, options: IPageReferenceOptions = {}) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));

        let instruction = `PAGEREF ${bookmarkId}`;

        if (options.hyperlink) {
            instruction = `${instruction} \\h`;
        }
        if (options.useRelativePosition) {
            instruction = `${instruction} \\p`;
        }

        this.root.push(instruction);
    }
}
