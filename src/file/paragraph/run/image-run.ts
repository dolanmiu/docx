import { uniqueId } from "@util/convenience-functions";

import { IContext, IXmlableObject } from "@file/xml-components";
import { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";

import { Drawing, IFloating } from "../../drawing";
import { IMediaTransformation } from "../../media";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

export interface IImageOptions {
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
}

export class ImageRun extends Run {
    private readonly key = `${uniqueId()}.png`;
    private readonly imageData: IMediaData;

    public constructor(options: IImageOptions) {
        super({});
        const newData = typeof options.data === "string" ? this.convertDataURIToBinary(options.data) : options.data;

        this.imageData = {
            stream: newData,
            fileName: this.key,
            transformation: {
                pixels: {
                    x: Math.round(options.transformation.width),
                    y: Math.round(options.transformation.height),
                },
                emus: {
                    x: Math.round(options.transformation.width * 9525),
                    y: Math.round(options.transformation.height * 9525),
                },
                flip: options.transformation.flip,
                rotation: options.transformation.rotation ? options.transformation.rotation * 60000 : undefined,
            },
        };
        const drawing = new Drawing(this.imageData, { floating: options.floating, docProperties: options.altText });

        this.root.push(drawing);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.key, this.imageData);

        return super.prepForXml(context);
    }

    private convertDataURIToBinary(dataURI: string): Uint8Array {
        if (typeof atob === "function") {
            // https://gist.github.com/borismus/1032746
            // https://github.com/mafintosh/base64-to-uint8array
            const BASE64_MARKER = ";base64,";
            const base64Index = dataURI.indexOf(BASE64_MARKER);

            const base64IndexWithOffset = base64Index === -1 ? 0 : base64Index + BASE64_MARKER.length;

            return new Uint8Array(
                atob(dataURI.substring(base64IndexWithOffset))
                    .split("")
                    .map((c) => c.charCodeAt(0)),
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const b = require("buf" + "fer");
            return new b.Buffer(dataURI, "base64");
        }
    }
}
