/// <reference types="node" />
import { IDocumentFooter } from "../file/footer-wrapper";
import { IDocumentHeader } from "../file/header-wrapper";
import { Media } from "../file/media";
export interface IDocumentTemplate {
    readonly currentRelationshipId: number;
    readonly headers: IDocumentHeader[];
    readonly footers: IDocumentFooter[];
    readonly styles: string;
    readonly titlePageIsDefined: boolean;
    readonly media: Media;
}
export declare class ImportDotx {
    extract(data: Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream): Promise<IDocumentTemplate>;
    private createFooters;
    private createHeaders;
    private addRelationshipToWrapper;
    private findReferenceFiles;
    private extractDocumentRefs;
    private checkIfTitlePageIsDefined;
    private parseRefId;
}
