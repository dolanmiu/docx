/**
 * External styles factory module for WordprocessingML documents.
 *
 * Provides functionality to import and parse styles from external XML sources.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { Element as XMLElement, xml2js } from "xml-js";

import { ImportedRootElementAttributes, ImportedXmlComponent, convertToXmlComponent } from "@file/xml-components";

import { IStylesOptions } from "./styles";

/**
 * Factory for creating styles from external XML sources.
 *
 * This factory parses styles from XML (typically from a styles.xml file)
 * and converts them into Styles components that can be used in the document.
 *
 * @example
 * ```typescript
 * // Import styles from an external styles.xml file
 * const factory = new ExternalStylesFactory();
 * const xmlData = '<?xml version="1.0"?><w:styles>...</w:styles>';
 * const styles = factory.newInstance(xmlData);
 * ```
 */
export class ExternalStylesFactory {
    /**
     * Creates new Styles based on the given XML data.
     *
     * Parses the styles XML and converts them to XmlComponent instances.
     *
     * Example content from styles.xml:
     * ```xml
     * <?xml version="1.0"?>
     * <w:styles xmlns:mc="some schema" ...>
     *   <w:style w:type="paragraph" w:styleId="Heading1">
     *     <w:name w:val="heading 1"/>
     *     ...
     *   </w:style>
     *   <w:style w:type="paragraph" w:styleId="Heading2">
     *     <w:name w:val="heading 2"/>
     *     ...
     *   </w:style>
     *   <w:docDefaults>...</w:docDefaults>
     * </w:styles>
     * ```
     *
     * @param xmlData - XML string containing styles data from styles.xml
     * @returns Styles object containing all parsed styles
     * @throws Error if styles element cannot be found in the XML
     */
    public newInstance(xmlData: string): IStylesOptions {
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

        return {
            initialStyles: new ImportedRootElementAttributes(stylesXmlElement.attributes),
            importedStyles: stylesElements.map((childElm) => convertToXmlComponent(childElm) as ImportedXmlComponent),
        };
    }
}
