import { uniqueId } from "convenience-functions";

import { IContext, IXmlableObject } from "file/xml-components";

import { Drawing, IFloating } from "../../drawing";
import { IMediaTransformation } from "../../media";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

export interface IImageOptions {
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
}

export class ImageRun extends Run {
    private readonly key = `${uniqueId()}.png`;
    private readonly imageData: IMediaData;

    constructor(options: IImageOptions) {
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
        const drawing = new Drawing(this.imageData, { floating: options.floating });

        this.root.push(drawing);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.key, this.imageData);

        return super.prepForXml(context);
    }

    private convertDataURIToBinary(dataURI: string): Uint8Array {
        // https://gist.github.com/borismus/1032746
        // https://github.com/mafintosh/base64-to-uint8array
        const BASE64_MARKER = ";base64,";

        const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;

        if (typeof atob === "function") {
            return new Uint8Array(
                atob(dataURI.substring(base64Index))
                    .split("")
                    .map((c) => c.charCodeAt(0)),
            );
        } else {
            const b = require("buf" + "fer");
            return new b.Buffer(dataURI, "base64");
        }
    }
}
