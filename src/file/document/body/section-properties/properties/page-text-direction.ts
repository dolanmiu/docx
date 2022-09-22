import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export enum PageTextDirectionType {
    LEFT_TO_RIGHT_TOP_TO_BOTTOM = "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT = "tbRl",
}

class PageTextDirectionAttributes extends XmlAttributeComponent<{ readonly val: PageTextDirectionType }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class PageTextDirection extends XmlComponent {
    public constructor(value: PageTextDirectionType) {
        super("w:textDirection");

        this.root.push(
            new PageTextDirectionAttributes({
                val: value,
            }),
        );
    }
}
