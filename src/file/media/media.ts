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

    public addImage(key: string, mediaData: IMediaData): void {
        this.map.set(key, mediaData);
    }

    public get Array(): readonly IMediaData[] {
        return Array.from(this.map.values());
    }
}
