import { XmlComponent } from "file/xml-components";
import { PageSizeAttributes } from "./page-size-attributes";

export class PageSize extends XmlComponent {
    constructor(width: number, height: number, orientation: string) {
        super("w:pgSz");

        const flip = orientation === "landscape";

        this.root.push(
            new PageSizeAttributes({
                width: flip ? height : width,
                height: flip ? width : height,
                orientation: orientation,
            }),
        );
    }
}
