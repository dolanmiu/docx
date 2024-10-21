import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export const PageTextDirectionType = {
    LEFT_TO_RIGHT_TOP_TO_BOTTOM: "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT: "tbRl",
} as const;

class PageTextDirectionAttributes extends XmlAttributeComponent<{
    readonly val: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class PageTextDirection extends XmlComponent {
    public constructor(value: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType]) {
        super("w:textDirection");

        this.root.push(
            new PageTextDirectionAttributes({
                val: value,
            }),
        );
    }
}
