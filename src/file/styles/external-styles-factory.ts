import { convertToXmlComponent, ImportedRootElementAttributes, ImportedXmlComponent } from "@file/xml-components";
import { Element as XMLElement, xml2js } from "xml-js";
import { Styles } from "./";

export class ExternalStylesFactory {
    /**
     * Creates new Style based on the given styles.
     * Parses the styles and convert them to XmlComponent.
     * Example content from styles.xml:
     * <?xml version="1.0">
     * <w:styles xmlns:mc="some schema" ...>
     *
     *   <w:style w:type="paragraph" w:styleId="Heading1">
     *           <w:name w:val="heading 1"/>
     *           .....
     *   </w:style>
     *
     *   <w:style w:type="paragraph" w:styleId="Heading2">
     *           <w:name w:val="heading 2"/>
     *           .....
     *   </w:style>
     *
     *   <w:docDefaults>Or any other element will be parsed to</w:docDefaults>
     *
     * </w:styles>
     *
     * @param externalStyles context from styles.xml
     */
    public newInstance(xmlData: string): Styles {
        const xmlObj = xml2js(xmlData, { compact: false }) as XMLElement;

        let stylesXmlElement: XMLElement | undefined;
        for (const xmlElm of xmlObj.elements || []) {
            if (xmlElm.name === "w:styles") {
                stylesXmlElement = xmlElm;
            }
        }
        if (stylesXmlElement === undefined) {
            throw new Error("can not find styles element");
        }

        const stylesElements = stylesXmlElement.elements || [];

        const importedStyle = new Styles({
            initialStyles: new ImportedRootElementAttributes(stylesXmlElement.attributes),
            importedStyles: stylesElements.map((childElm) => convertToXmlComponent(childElm) as ImportedXmlComponent),
        });

        return importedStyle;
    }
}
