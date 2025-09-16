import { WpsShape } from "@file/drawing/inline/graphic/graphic-data/wps/wps-shape";
import { IExtendedMediaData, IMediaData, IMediaDataTransformation, WpgMediaData } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";
import { OutlineOptions } from "./pic/shape-properties/outline/outline";
import { SolidFillOptions } from "./pic/shape-properties/outline/solid-fill";
import { WpgGroup } from "./wpg/wpg-group";

export class GraphicData extends XmlComponent {
    // private readonly pic: Pic;

    public constructor({
        mediaData,
        transform,
        outline,
        solidFill,
    }: {
        readonly mediaData: IExtendedMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
        readonly solidFill?: SolidFillOptions;
    }) {
        super("a:graphicData");

        if (mediaData.type === "wps") {
            this.root.push(
                new GraphicDataAttributes({
                    uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                }),
            );
            const wps = new WpsShape({ ...mediaData.data, transformation: transform, outline, solidFill });
            this.root.push(wps);
        } else if (mediaData.type === "wpg") {
            this.root.push(
                new GraphicDataAttributes({
                    uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                }),
            );
            const md = mediaData as WpgMediaData
            const children = md.children.map(child => {
                // eslint-disable-next-line unicorn/prefer-ternary
                if (child.type === "wps") {
                    return new WpsShape({ ...child.data, transformation: child.transformation, outline: child.outline, solidFill: child.solidFill });
                } else {
                    return new Pic({ mediaData: child, transform: child.transformation, outline: child.outline });
                }
            })
            // const wps = new WpsShape({ ...mediaData.data, transformation: transform, outline, solidFill });
            const wpg = new WpgGroup({ children, transformation: transform });
            this.root.push(wpg);
        } else {
            this.root.push(
                new GraphicDataAttributes({
                    uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
                }),
            );
            const md = mediaData as IMediaData
            const pic = new Pic({ mediaData: md, transform, outline });
            this.root.push(pic);
        }

        // if (mediaData.type !== "wps") {
        //     const pic = new Pic({ mediaData, transform, outline });
        //     this.root.push(pic);
        // } else {
        //     const wps = new WpsShape({ ...mediaData.data, transformation: transform, outline, solidFill });
        //     this.root.push(wps);
        // }
    }
}
