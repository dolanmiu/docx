import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes"

export class Style {
    private styles: Array<XmlComponent>;

    constructor() {
        this.styles = new Array<XmlComponent>();
        this.styles.push(new DocumentAttributes({
            mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
            r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
            w14: 'http://schemas.microsoft.com/office/word/2010/wordml',
            w15: 'http://schemas.microsoft.com/office/word/2012/wordml',
            Ignorable: 'w14 w15'
        }))
    }
}