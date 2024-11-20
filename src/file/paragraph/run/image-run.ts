import { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import { IContext, IXmlableObject } from "@file/xml-components";
import { hashedId } from "@util/convenience-functions";

import { Drawing, IFloating } from "../../drawing";
import { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import { IMediaTransformation } from "../../media";
import { IMediaData } from "../../media/data";
import { Run } from "../run";

type CoreImageOptions = {
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
};

type RegularImageOptions = {
    readonly type: "jpg" | "png" | "gif" | "bmp";
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

type SvgMediaOptions = {
    readonly type: "svg";
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /**
     * Required in case the Word processor does not support SVG.
     */
    readonly fallback: RegularImageOptions;
};

export type IImageOptions = (RegularImageOptions | SvgMediaOptions) & CoreImageOptions;

const convertDataURIToBinary = (dataURI: string): Uint8Array => {
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
        /* c8 ignore next 6 */
    } else {
        // Not possible to test this branch in NodeJS
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const b = require("buf" + "fer");
        return new b.Buffer(dataURI, "base64");
    }
};

const standardizeData = (data: string | Buffer | Uint8Array | ArrayBuffer): Buffer | Uint8Array | ArrayBuffer =>
    typeof data === "string" ? convertDataURIToBinary(data) : data;

const createImageData = (options: IImageOptions, key: string): Pick<IMediaData, "data" | "fileName" | "transformation"> => ({
    data: standardizeData(options.data),
    fileName: key,
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
});

export class ImageRun extends Run {
    private readonly imageData: IMediaData;

    public constructor(options: IImageOptions) {
        super({});

        const hash = hashedId(options.data);
        const key = `${hash}.${options.type}`;

        this.imageData =
            options.type === "svg"
                ? {
                      type: options.type,
                      ...createImageData(options, key),
                      fallback: {
                          type: options.fallback.type,
                          ...createImageData(
                              {
                                  ...options.fallback,
                                  transformation: options.transformation,
                              },
                              `${hashedId(options.fallback.data)}.${options.fallback.type}`,
                          ),
                      },
                  }
                : {
                      type: options.type,
                      ...createImageData(options, key),
                  };
        const drawing = new Drawing(this.imageData, {
            floating: options.floating,
            docProperties: options.altText,
            outline: options.outline,
        });

        this.root.push(drawing);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.imageData.fileName, this.imageData);

        if (this.imageData.type === "svg") {
            context.file.Media.addImage(this.imageData.fallback.fileName, this.imageData.fallback);
        }

        return super.prepForXml(context);
    }
}
