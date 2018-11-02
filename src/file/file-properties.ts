import { IDocumentTemplate } from "../import-dotx";

export interface IFileProperties {
    readonly template?: IDocumentTemplate;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND = "";
