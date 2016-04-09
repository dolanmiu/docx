import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes";

abstract class Component extends XmlComponent {
    protected createNullBlockOrValue(value: string): XmlComponent {
        /*if (value === undefined) {
            return [{}];
        } else {
            return value;
        }*/
        return null;
    }
}
export class Title extends Component {

    constructor(value: string) {
        super("dc:title");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class Subject extends Component {

    constructor(value: string) {
        super("dc:subject");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class Creator extends Component {

    constructor(value: string) {
        super("dc:creator");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class Keywords extends Component {

    constructor(value: string) {
        super("cp:keywords");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class Description extends Component {

    constructor(value: string) {
        super("dc:description");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class LastModifiedBy extends Component {
    
    constructor(value: string) {
        super("cp:lastModifiedBy");
        this.root.push(this.createNullBlockOrValue(value));
    }
}

export class Revision extends Component {

    constructor(value: string) {
        super("cp:revision");
        var revision = this.createNullBlockOrValue(value);
        this.root.push(this.createNullBlockOrValue(value));
    }
}

abstract class DateComponent extends XmlComponent {
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

export class Created extends DateComponent {

    constructor() {
        super("dcterms:created");
        this.root.push(new DocumentAttributes({
            type: "dcterms:W3CDTF"
        }));
        this.root.push(this.getCurrentDate());
    }
}

export class Modified extends DateComponent implements XmlComponent {

    constructor() {
        super("dcterms:modified");
        this.root.push(new DocumentAttributes({
            type: "dcterms:W3CDTF"
        }));
        this.root.push(this.getCurrentDate());
    }
}