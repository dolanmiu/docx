import { TextWrappingType } from "@file/drawing/text-wrap";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { OnOffElement } from "@file/xml-components/simple-elements";

export enum VerticalAnchor {
    CENTER = "ctr",
    TOP = "t",
    BOTTOM = "b",
}

export type IBodyPropertiesOptions = {
    readonly wrap?: (typeof TextWrappingType)[keyof typeof TextWrappingType];
    readonly verticalAnchor?: VerticalAnchor;
    readonly margins?: {
        readonly top?: number;
        readonly bottom?: number;
        readonly left?: number;
        readonly right?: number;
    };
    readonly noAutoFit?: boolean;
};

class BodyPropertiesAttributes extends XmlAttributeComponent<{
    // readonly wrap?: (typeof TextWrappingType)[keyof typeof TextWrappingType];
    readonly lIns?: number;
    readonly rIns?: number;
    readonly tIns?: number;
    readonly bIns?: number;
    readonly anchor?: VerticalAnchor;
}> {
    protected readonly xmlKeys = {
        wrap: "wrap",
        lIns: "lIns",
        rIns: "rIns",
        tIns: "tIns",
        bIns: "bIns",
        anchor: "anchor",
    };
}

export class BodyProperties extends XmlComponent {
    public constructor(options: IBodyPropertiesOptions = {}) {
        super("wps:bodyPr");

        this.root.push(
            new BodyPropertiesAttributes({
                // wrap: options.wrap,
                lIns: options.margins?.left,
                rIns: options.margins?.right,
                tIns: options.margins?.top,
                bIns: options.margins?.bottom,
                anchor: options.verticalAnchor,
            }),
        );

        if (options.noAutoFit) {
            this.root.push(new OnOffElement("a:noAutofit", options.noAutoFit));
        }
    }
}
