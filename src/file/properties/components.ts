import { XmlComponent } from "file/xml-components";
import { DocumentAttributes } from "../document/document-attributes";

export class Title extends XmlComponent {
    constructor(value: string) {
        super("dc:title");
        this.root.push(value);
    }
}

export class Subject extends XmlComponent {
    constructor(value: string) {
        super("dc:subject");
        this.root.push(value);
    }
}

export class Creator extends XmlComponent {
    constructor(value: string) {
        super("dc:creator");
        this.root.push(value);
    }
}

export class Keywords extends XmlComponent {
    constructor(value: string) {
        super("cp:keywords");
        this.root.push(value);
    }
}

export class Description extends XmlComponent {
    constructor(value: string) {
        super("dc:description");
        this.root.push(value);
    }
}

export class LastModifiedBy extends XmlComponent {
    constructor(value: string) {
        super("cp:lastModifiedBy");
        this.root.push(value);
    }
}

export class Revision extends XmlComponent {
    constructor(value: string) {
        super("cp:revision");
        this.root.push(value);
    }
}

export abstract class DateComponent extends XmlComponent {
    protected getCurrentDate(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        const seconds = ("0" + date.getSeconds()).slice(-2);

        return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + "Z";
    }
}

export class Created extends DateComponent {
    constructor() {
        super("dcterms:created");
        this.root.push(
            new DocumentAttributes({
                type: "dcterms:W3CDTF",
            }),
        );
        this.root.push(this.getCurrentDate());
    }
}

export class Modified extends DateComponent {
    constructor() {
        super("dcterms:modified");
        this.root.push(
            new DocumentAttributes({
                type: "dcterms:W3CDTF",
            }),
        );
        this.root.push(this.getCurrentDate());
    }
}
