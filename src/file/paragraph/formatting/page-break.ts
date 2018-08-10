// http://officeopenxml.com/WPtextSpecialContent-break.php
import { Attributes, XmlComponent } from "file/xml-components";
import { Run } from "../run";

class Break extends XmlComponent {
    constructor() {
        super("w:br");
        this.root.push(
            new Attributes({
                type: "page",
            }),
        );
    }
}

export class PageBreak extends Run {
    constructor() {
        super();
        this.root.push(new Break());
    }
}

/**
 * Add page break before the paragraph if there is no one added before.
 */
export class PageBreakBefore extends XmlComponent {
    constructor() {
        super("w:pageBreakBefore");
    }
}
