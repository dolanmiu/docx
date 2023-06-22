// http://www.datypic.com/sc/ooxml/e-w_sdtPr-1.html
import { CheckBoxUtil } from "@file/checkbox";
import { StringValueElement, XmlComponent } from "@file/xml-components";

export type SdtPrChild =
    | CheckBoxUtil;

export interface ISdtPropertiesOptions {
    readonly children : readonly SdtPrChild[];
}
export class StructuredDocumentTagProperties extends XmlComponent {
    public constructor(alias?: string, options?: ISdtPropertiesOptions) {
        super("w:sdtPr");

        if(typeof alias === 'string'){
            this.root.push(new StringValueElement("w:alias", alias));
        }

        if(options?.children){
            for(const child of options.children){
                this.root.push(child)
            }
        }
    }
}
