import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes"
import {DocumentDefaults} from "./defaults";
import {LatentStyles} from "./latent-styles";
import {LatentStyleException} from "./latent-styles/exceptions";
import {LatentStyleExceptionAttributes} from "./latent-styles/exceptions/attributes";

export class Style implements XmlComponent {
    private styles: Array<XmlComponent>;

    xmlKeys = {
        styles: 'w:styles'
    }

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
        this.styles.push(new DocumentDefaults());
        var latentStyles = new LatentStyles();
        //latentStyles.push(new LatentStyleException(new LatentStyleExceptionAttributes({
        //    name: "Normal"
        //})));
        this.styles.push(latentStyles);
    }

    push(style: XmlComponent): void {
        this.styles.push(style);
    }
}