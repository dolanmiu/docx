/**
 * Text module for WordprocessingML run content.
 *
 * This module provides the Text class for text content within runs.
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "../text-attributes";

// <xsd:complexType name="CT_Text">
//     <xsd:simpleContent>
//         <xsd:extension base="s:ST_String">
//             <xsd:attribute ref="xml:space" use="optional" />
//         </xsd:extension>
//     </xsd:simpleContent>
// </xsd:complexType>

/**
 * Options for creating a Text element.
 */
type ITextOptions = {
    /** How whitespace should be handled */
    readonly space?: (typeof SpaceType)[keyof typeof SpaceType];
    /** The text content */
    readonly text?: string;
};

/**
 * Represents a text element within a run.
 *
 * Text is the container for actual character content in a Word document.
 * It corresponds to the `<w:t>` element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Text">
 *   <xsd:simpleContent>
 *     <xsd:extension base="s:ST_String">
 *       <xsd:attribute ref="xml:space" use="optional"/>
 *     </xsd:extension>
 *   </xsd:simpleContent>
 * </xsd:complexType>
 * ```
 */
export class Text extends XmlComponent {
    public constructor(options: string | ITextOptions) {
        super("w:t");

        if (typeof options === "string") {
            this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
            this.root.push(options);
        } else {
            this.root.push(new TextAttributes({ space: options.space ?? SpaceType.DEFAULT }));
            this.root.push(options.text);
        }
    }
}
