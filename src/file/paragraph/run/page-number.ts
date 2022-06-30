import { SpaceType } from "@file/space-type";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "./text-attributes";

export class Page extends XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("PAGE");
    }
}

export class NumberOfPages extends XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("NUMPAGES");
    }
}

export class NumberOfPagesSection extends XmlComponent {
    constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("SECTIONPAGES");
    }
}
