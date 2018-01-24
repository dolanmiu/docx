import { XmlComponent } from "file/xml-components";
import { PageSizeAttributes } from "./page-size-attributes";

export class PageSize extends XmlComponent {
    constructor(width: number, height: number) {
        super("w:pgSz");

        this.root.push(
            new PageSizeAttributes({
                width: width,
                height: height,
            }),
        );
    }
}
