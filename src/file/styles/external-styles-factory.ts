import { Styles } from "./";
import * as fastXmlParser from "fast-xml-parser";
import { ImportedXmlComponent, ImportedRootElementAttributes, parseOptions, convertToXmlComponent } from "./../../file/xml-components";

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
     * @param externalStyles context from styles.xml
     */
    public newInstance(externalStyles: string): Styles {
        const xmlStyles = fastXmlParser.parse(externalStyles, parseOptions)["w:styles"];
        // create styles with attributes from the parsed xml
        const importedStyle = new Styles(new ImportedRootElementAttributes(xmlStyles._attr));

        // convert other elements (not styles definitions, but default styles and so on ...)
        Object.keys(xmlStyles)
            .filter((element) => element !== "_attr" && element !== "w:style")
            .forEach((element) => {
                importedStyle.push(new ImportedXmlComponent(element, xmlStyles[element]._attr));
            });

        // convert the styles one by one
        xmlStyles["w:style"].map((style) => convertToXmlComponent("w:style", style)).forEach(importedStyle.push.bind(importedStyle));
        return importedStyle;
    }
}
