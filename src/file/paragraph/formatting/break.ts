// http://officeopenxml.com/WPtextSpecialContent-break.php
import { Attributes, XmlComponent } from "@file/xml-components";

import { Run } from "../run";

const BreakType = {
    COLUMN: "column",
    PAGE: "page",
    // textWrapping breaks are the default and already exposed via the "Run" class
} as const;

class Break extends XmlComponent {
    public constructor(type: (typeof BreakType)[keyof typeof BreakType]) {
        super("w:br");
        this.root.push(
            new Attributes({
                type,
            }),
        );
    }
}

export class PageBreak extends Run {
    public constructor() {
        super({});
        this.root.push(new Break(BreakType.PAGE));
    }
}

export class ColumnBreak extends Run {
    public constructor() {
        super({});
        this.root.push(new Break(BreakType.COLUMN));
    }
}

/**
 * Add page break before the paragraph if there is no one added before.
 */
export class PageBreakBefore extends XmlComponent {
    public constructor() {
        super("w:pageBreakBefore");
    }
}
