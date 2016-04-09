import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes"
import {DocumentDefaults} from "./defaults";
import {LatentStyles} from "./latent-styles";
import {LatentStyleException} from "./latent-styles/exceptions";
import {LatentStyleExceptionAttributes} from "./latent-styles/exceptions/attributes";

export class Styles extends XmlComponent {

    constructor() {
        super("w:styles");
        this.root.push(new DocumentAttributes({
            mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
            r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
            w14: 'http://schemas.microsoft.com/office/word/2010/wordml',
            w15: 'http://schemas.microsoft.com/office/word/2012/wordml',
            Ignorable: 'w14 w15'
        }))
        this.root.push(new DocumentDefaults());
        var latentStyles = new LatentStyles();
        //latentStyles.push(new LatentStyleException(new LatentStyleExceptionAttributes({
        //    name: "Normal"
        //})));
        this.root.push(latentStyles);
    }

    push(style: XmlComponent): void {
        this.root.push(style);
    }
}