import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes";

abstract class Component {
    protected createNullBlockOrValue(value: string): Object {
        if (value === undefined) {
            return [{}];
        } else {
            return value;
        }
    }
}
export class Title extends Component implements XmlComponent {
    private title: Object;

    xmlKeys = {
        title: "dc:title"
    }

    constructor(value: string) {
        super();
        var title = this.createNullBlockOrValue(value);
        this.title = title;
    }
}

export class Subject extends Component implements XmlComponent {
    private subject: Object;

    xmlKeys = {
        subject: "dc:subject"
    }

    constructor(value: string) {
        super();
        var subject = this.createNullBlockOrValue(value);
        this.subject = subject;
    }
}

export class Creator extends Component implements XmlComponent {
    private creator: Object;

    xmlKeys = {
        creator: "dc:creator"
    }

    constructor(value: string) {
        super();
        var creator = this.createNullBlockOrValue(value);
        this.creator = creator;
    }
}

export class Keywords extends Component implements XmlComponent {
    private keywords: Object;

    xmlKeys = {
        keywords: "dc:keywords"
    }

    constructor(value: string) {
        super();
        var keywords = this.createNullBlockOrValue(value);
        this.keywords = keywords;
    }
}

export class Description extends Component implements XmlComponent {
    private description: Object;

    xmlKeys = {
        description: "dc:description"
    }

    constructor(value: string) {
        super();
        var description = this.createNullBlockOrValue(value);
        this.description = description;
    }
}

export class LastModifiedBy extends Component implements XmlComponent {
    private lastModifiedBy: Object;

    xmlKeys = {
        lastModifiedBy: "dc:lastModifiedBy"
    }

    constructor(value: string) {
        super();
        var lastModifiedBy = this.createNullBlockOrValue(value);
        this.lastModifiedBy = lastModifiedBy;
    }
}

export class Revision extends Component implements XmlComponent {
    private revision: Object;

    xmlKeys = {
        revision: "dc:revision"
    }

    constructor(value: string) {
        super();
        var revision = this.createNullBlockOrValue(value);
        this.revision = revision;
    }
}

abstract class DateComponent {
    protected getCurrentDate(): any {
        var date = new Date(),
            year = date.getFullYear(),
            month = ('0' + (date.getMonth() + 1)).slice(-2),
            day = ('0' + date.getDate()).slice(-2),
            hours = ('0' + date.getHours()).slice(-2),
            minutes = ('0' + date.getMinutes()).slice(-2),
            seconds = ('0' + date.getSeconds()).slice(-2);

        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + 'Z';
    }
}

export class Created extends DateComponent implements XmlComponent {
    private created: Array<XmlComponent>;

    xmlKeys = {
        created: "dcterms:created"
    }

    constructor() {
        super();
        this.created = new Array<XmlComponent>();
        this.created.push(new DocumentAttributes({
            type: "dcterms:W3CDTF"
        }));
        this.created.push(this.getCurrentDate());
    }
}

export class Modified extends DateComponent implements XmlComponent {
    private modified: Array<XmlComponent>;

    xmlKeys = {
        modified: "dcterms:modified"
    }

    constructor() {
        super();
        this.modified = new Array<XmlComponent>();
        this.modified.push(new DocumentAttributes({
            type: "dcterms:W3CDTF"
        }));
        this.modified.push(this.getCurrentDate());
    }
}