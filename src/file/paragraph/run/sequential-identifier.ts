/**
 * Sequential identifier module for WordprocessingML documents.
 *
 * This module provides support for SEQ (sequence) fields, which are used to
 * automatically number items in a document such as figures, tables, and equations.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { Run } from "@file/paragraph/run";
import { createBeginDirtyWithoutPageNumbers, createEnd, createSeparate } from "@file/paragraph/run/field";

import { SequentialIdentifierInstruction } from "./sequential-identifier-instruction";

/**
 * Represents a sequential identifier field in a WordprocessingML document.
 *
 * SequentialIdentifier creates a SEQ field that automatically numbers items in a document.
 * Each identifier maintains its own sequence, allowing you to have separate numbering
 * for figures, tables, equations, etc.
 *
 * It is written dirty, so Word numbers it when it opens the document, after asking to update the fields. When the
 * document is given `pageNumbers`, it is written clean, with its number counted as Word counts it, or blank where
 * Word's count isn't known, and Word doesn't ask.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RunInnerContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a figure number
 * new SequentialIdentifier("Figure");
 *
 * // Create a table number
 * new SequentialIdentifier("Table");
 *
 * // Create an equation number
 * new SequentialIdentifier("Equation");
 * ```
 */
export class SequentialIdentifier extends Run {
    public constructor(identifier: string) {
        super({});
        this.root.push(createBeginDirtyWithoutPageNumbers());
        this.root.push(new SequentialIdentifierInstruction(identifier));
        this.root.push(createSeparate());
        this.root.push(createEnd());
    }
}
