import { uniqueId } from "@util/convenience-functions";

import { IMediaData } from "./data";

export interface IMediaTransformation {
    readonly width: number;
    readonly height: number;
    readonly flip?: {
        readonly vertical?: boolean;
        readonly horizontal?: boolean;
    };
    readonly rotation?: number;
}

export class Media {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly map: Map<string, IMediaData>;

    public constructor() {
        this.map = new Map<string, IMediaData>();
    }

    public addMedia(data: Buffer | string | Uint8Array | ArrayBuffer, transformation: IMediaTransformation): IMediaData {
        const key = `${uniqueId()}.png`;

        const newData = typeof data === "string" ? this.convertDataURIToBinary(data) : data;

        const imageData: IMediaData = {
            stream: newData,
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

    public addImage(key: string, mediaData: IMediaData): void {
        this.map.set(key, mediaData);
    }

    public get Array(): readonly IMediaData[] {
        return Array.from(this.map.values());
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
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const b = require("buf" + "fer");
            return new b.Buffer(dataURI, "base64");
        }
    }
}
