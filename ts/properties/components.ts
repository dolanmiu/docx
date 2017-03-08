import { DocumentAttributes } from "../docx/document/document-attributes";
import { XmlUnitComponent } from "../docx/xml-components";
import { XmlComponent } from "../docx/xml-components";

export class Title extends XmlUnitComponent {

    constructor(value: string) {
        super("dc:title");
        this.root = value;
    }
}

export class Subject extends XmlUnitComponent {

    constructor(value: string) {
        super("dc:subject");
        this.root = value;
    }
}

export class Creator extends XmlUnitComponent {

    constructor(value: string) {
        super("dc:creator");
        this.root = value;
    }
}

export class Keywords extends XmlUnitComponent {

    constructor(value: string) {
        super("cp:keywords");
        this.root = value;
    }
}

export class Description extends XmlUnitComponent {

    constructor(value: string) {
        super("dc:description");
        this.root = value;
    }
}

export class LastModifiedBy extends XmlUnitComponent {

    constructor(value: string) {
        super("cp:lastModifiedBy");
        this.root = value;
    }
}

export class Revision extends XmlUnitComponent {

    constructor(value: string) {
        super("cp:revision");
        const revision = value;
        this.root = value;
    }
}

abstract class DateComponent extends XmlComponent {
    protected getCurrentDate(): any {
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
        this.root.push(new DocumentAttributes({
            type: "dcterms:W3CDTF",
        }));
        this.root.push(this.getCurrentDate());
    }
}

export class Modified extends DateComponent {

    constructor() {
        super("dcterms:modified");
        this.root.push(new DocumentAttributes({
            type: "dcterms:W3CDTF",
        }));
        this.root.push(this.getCurrentDate());
    }
}
