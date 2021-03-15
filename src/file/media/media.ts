import { uniqueId } from "convenience-functions";

import { IFloating } from "../drawing";
import { File } from "../file";
import { PictureRun } from "../paragraph";
import { IMediaData } from "./data";
// import { Image } from "./image";

interface IMediaTransformation {
    readonly width: number;
    readonly height: number;
    readonly flip?: {
        readonly vertical?: boolean;
        readonly horizontal?: boolean;
    };
    readonly rotation?: number;
}

export class Media {
    public static addImage(options: {
        readonly document: File;
        readonly data: Buffer | string | Uint8Array | ArrayBuffer;
        readonly transformation: IMediaTransformation;
        readonly floating?: IFloating;
    }): PictureRun {
        // Workaround to expose id without exposing to API
        const mediaData = options.document.Media.addMedia(options.data, options.transformation);
        return new PictureRun(mediaData, { floating: options.floating });
    }

    private readonly map: Map<string, IMediaData>;

    constructor() {
        this.map = new Map<string, IMediaData>();
    }

    public getMedia(key: string): IMediaData {
        const data = this.map.get(key);

        if (data === undefined) {
            throw new Error(`Cannot find image with the key ${key}`);
        }

        return data;
    }

    public addMedia(buffer: Buffer | string | Uint8Array | ArrayBuffer, transformation: IMediaTransformation): IMediaData {
        return this.createMedia(`${uniqueId()}.png`, transformation, buffer);
    }

    private createMedia(
        key: string,
        transformation: IMediaTransformation,
        data: Buffer | string | Uint8Array | ArrayBuffer,
        filePath?: string,
    ): IMediaData {
        const newData = typeof data === "string" ? this.convertDataURIToBinary(data) : data;

        const imageData: IMediaData = {
            stream: newData,
            path: filePath,
            fileName: key,
            transformation: {
                pixels: {
                    x: Math.round(transformation.width),
                    y: Math.round(transformation.height),
                },
                emus: {
                    x: Math.round(transformation.width * 9525),
                    y: Math.round(transformation.height * 9525),
                },
                flip: transformation.flip,
                rotation: transformation.rotation ? transformation.rotation * 60000 : undefined,
            },
        };

        this.map.set(key, imageData);

        return imageData;
    }

    public get Array(): readonly IMediaData[] {
        const array = new Array<IMediaData>();

        this.map.forEach((data) => {
            array.push(data);
        });

        return array;
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
