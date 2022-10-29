import { TextAttributes } from "@file/paragraph/run/text-attributes";
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

export class DeletedPage extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("PAGE");
    }
}

export class DeletedNumberOfPages extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("NUMPAGES");
    }
}

export class DeletedNumberOfPagesSection extends XmlComponent {
    public constructor() {
        super("w:delInstrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("SECTIONPAGES");
    }
}
