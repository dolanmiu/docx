import type { TextWrappingType } from "@file/drawing/text-wrap";
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { OnOffElement } from "@file/xml-components/simple-elements";

/**
 * @publicApi
 */
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

export const createBodyProperties = (options: IBodyPropertiesOptions = {}): XmlComponent =>
    new BuilderElement<{
        readonly lIns?: number;
        readonly rIns?: number;
        readonly tIns?: number;
        readonly bIns?: number;
        readonly anchor?: VerticalAnchor;
    }>({
        name: "wps:bodyPr",
        attributes: {
            lIns: { key: "lIns", value: options.margins?.left },
            rIns: { key: "rIns", value: options.margins?.right },
            tIns: { key: "tIns", value: options.margins?.top },
            bIns: { key: "bIns", value: options.margins?.bottom },
            anchor: { key: "anchor", value: options.verticalAnchor },
        },
        children: [...(options.noAutoFit ? [new OnOffElement("a:noAutofit", options.noAutoFit)] : [])],
    });
