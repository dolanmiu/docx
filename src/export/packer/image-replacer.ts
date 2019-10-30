import { IMediaData, Media } from "file/media";

export class ImageReplacer {
    public replace(xmlData: string, mediaData: IMediaData[], offset: number): string {
        let currentXmlData = xmlData;

        mediaData.forEach((image, i) => {
            currentXmlData = currentXmlData.replace(new RegExp(`{${image.fileName}}`, "g"), (offset + i).toString());
        });

        return currentXmlData;
    }

    public getMediaData(xmlData: string, media: Media): IMediaData[] {
        return media.Array.filter((image) => xmlData.search(`{${image.fileName}}`) > 0);
    }
}
