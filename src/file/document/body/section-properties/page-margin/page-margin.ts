import { XmlComponent } from "file/xml-components";
import { PageMarginAttributes } from "./page-margin-attributes";

export class PageMargin extends XmlComponent {
    constructor(top: number, right: number, bottom: number, left: number, header: number, footer: number, gutter: number, mirror: boolean) {
        super("w:pgMar");
        this.root.push(
            new PageMarginAttributes({
                top: top,
                right: right,
                bottom: bottom,
                left: left,
                header: header,
                footer: footer,
                gutter: gutter,
                mirror: mirror,
            }),
        );
    }
}
