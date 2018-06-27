import { XmlComponent } from "file/xml-components";
import { PageOrientation, PageSizeAttributes } from "./page-size-attributes";

export class PageSize extends XmlComponent {
    constructor(width: number, height: number, orientation: PageOrientation) {
        super("w:pgSz");

        const flip = orientation === PageOrientation.LANDSCAPE;

        this.root.push(
            new PageSizeAttributes({
                width: flip ? height : width,
                height: flip ? width : height,
                orientation: orientation,
            }),
        );
    }
}
