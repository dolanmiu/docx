import { IDrawingOptions } from "../drawing";
import { File } from "../file";
import { ImageParagraph } from "../paragraph";
import { IMediaData } from "./data";
import { Image } from "./image";

interface IHackedFile {
    // tslint:disable-next-line:readonly-keyword
    currentRelationshipId: number;
}

export class Media {
    public static addImage(
        file: File,
        buffer: Buffer | string | Uint8Array | ArrayBuffer,
        width?: number,
        height?: number,
        drawingOptions?: IDrawingOptions,
    ): Image {
        // Workaround to expose id without exposing to API
        const exposedFile = (file as {}) as IHackedFile;
        const mediaData = file.Media.addMedia(buffer, exposedFile.currentRelationshipId++, width, height);
        file.DocumentRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );

        return new Image(new ImageParagraph(mediaData, drawingOptions));
    }

    private static generateId(): string {
        // https://gist.github.com/6174/6062387
        return (
            Math.random()
                .toString(36)
                .substring(2, 15) +
            Math.random()
                .toString(36)
                .substring(2, 15)
        );
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

    public addMedia(
        buffer: Buffer | string | Uint8Array | ArrayBuffer,
        referenceId: number,
        width: number = 100,
        height: number = 100,
    ): IMediaData {
        const key = `${Media.generateId()}.png`;

        return this.createMedia(
            key,
            referenceId,
            {
                width: width,
                height: height,
            },
            buffer,
        );
    }

    private createMedia(
        key: string,
        relationshipsCount: number,
        dimensions: { readonly width: number; readonly height: number },
        data: Buffer | string | Uint8Array | ArrayBuffer,
        filePath?: string,
    ): IMediaData {
        const newData = typeof data === "string" ? this.convertDataURIToBinary(data) : data;

        const imageData: IMediaData = {
            referenceId: relationshipsCount,
            stream: newData,
            path: filePath,
            fileName: key,
            dimensions: {
                pixels: {
                    x: Math.round(dimensions.width),
                    y: Math.round(dimensions.height),
                },
                emus: {
                    x: Math.round(dimensions.width * 9525),
                    y: Math.round(dimensions.height * 9525),
                },
            },
        };

        this.map.set(key, imageData);

        return imageData;
    }

    public get Array(): IMediaData[] {
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
