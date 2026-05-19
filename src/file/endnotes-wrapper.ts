import type { IViewWrapper } from "./document-wrapper";
import { Endnotes } from "./endnotes/endnotes";
import { Relationships } from "./relationships";

export class EndnotesWrapper implements IViewWrapper {
    private readonly endnotes: Endnotes;
    private readonly relationships: Relationships;

    public constructor() {
        this.endnotes = new Endnotes();
        this.relationships = new Relationships();
    }

    public get View(): Endnotes {
        return this.endnotes;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
