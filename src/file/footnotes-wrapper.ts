import { IViewWrapper } from "./document-wrapper";
import { FootNotes } from "./footnotes/footnotes";
import { Relationships } from "./relationships";

export class FootnotesWrapper implements IViewWrapper {
    private readonly footnotess: FootNotes;
    private readonly relationships: Relationships;

    public constructor() {
        this.footnotess = new FootNotes();
        this.relationships = new Relationships();
    }

    public get View(): FootNotes {
        return this.footnotess;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
