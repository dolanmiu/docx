import { Attributes, XmlComponent } from "file/xml-components";

export class PageSize extends XmlComponent {
    constructor() {
        super("w:pgSz");
        this.root.push(
            new Attributes({
                w: "11906",
                h: "16838",
            }),
        );
    }
}
