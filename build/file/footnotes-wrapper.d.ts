import { IViewWrapper } from "./document-wrapper";
import { FootNotes } from "./footnotes/footnotes";
import { Relationships } from "./relationships";
export declare class FootnotesWrapper implements IViewWrapper {
    private readonly footnotess;
    private readonly relationships;
    constructor();
    get View(): FootNotes;
    get Relationships(): Relationships;
}
