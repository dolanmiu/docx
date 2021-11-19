import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum PageTextDirection {
    LEFT_TO_RIGHT_TOP_TO_BOTTOM = "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT = "tbRl",
}

class PageTextDirectionAttributes extends XmlAttributeComponent<{ readonly val: PageTextDirection }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class PageTDirection extends XmlComponent {
    constructor(value: PageTextDirection) {
        super("w:textDirection");

        this.root.push(
            new PageTextDirectionAttributes({
                val: value,
            }),
        );
    }
}
