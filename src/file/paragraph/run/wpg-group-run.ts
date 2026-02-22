import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { IContext, IXmlableObject } from "@file/xml-components";

import { Run } from ".";
import { createTransformation } from "./wps-shape-run";
import { Drawing, type IFloating } from "../../drawing";
import type { IGroupChildMediaData, IMediaData, IMediaTransformation, WpgMediaData } from "../../media";

export * from "@file/drawing/inline/graphic/graphic-data/wps/body-properties";

type CoreGroupOptions = {
    readonly children: readonly IGroupChildMediaData[];
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
};

/**
 * @publicApi
 */
export type IWpgGroupOptions = { readonly type: "wpg" } & CoreGroupOptions;

/**
 * @publicApi
 */
export class WpgGroupRun extends Run {
    private readonly wpgGroupData: WpgMediaData;
    private readonly mediaDatas: readonly IMediaData[];

    public constructor(options: IWpgGroupOptions) {
        super({});

        this.wpgGroupData = {
            type: options.type,
            transformation: createTransformation(options.transformation),
            children: options.children,
        };
        const drawing = new Drawing(this.wpgGroupData, {
            floating: options.floating,
            docProperties: options.altText,
        });

        this.mediaDatas = options.children.filter((child) => child.type !== "wps").map((child) => child as IMediaData);

        this.root.push(drawing);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.mediaDatas.forEach((child) => {
            context.file.Media.addImage(child.fileName, child);

            if (child.type === "svg") {
                context.file.Media.addImage(child.fallback.fileName, child.fallback);
            }
        });
        return super.prepForXml(context);
    }
}
