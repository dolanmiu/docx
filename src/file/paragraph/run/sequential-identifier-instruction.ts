/**
 * Sequential identifier instruction module for WordprocessingML documents.
 *
 * This module provides the SEQ field instruction for creating
 * auto-numbered sequences like figure numbers, table numbers, etc.
 *
 * Reference: http://officeopenxml.com/WPfieldInstructions.php
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "./text-attributes";

/**
 * Represents a SEQ field instruction.
 *
 * The SEQ field inserts an automatically incrementing sequence number,
 * useful for numbering figures, tables, equations, or custom sequences.
 *
 * @example
 * ```typescript
 * // Create a figure number sequence
 * new SequentialIdentifierInstruction("Figure");
 *
 * // Create a table number sequence
 * new SequentialIdentifierInstruction("Table");
 * ```
 *
 * @internal
 */
export class SequentialIdentifierInstruction extends XmlComponent {
    public constructor(identifier: string) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(`SEQ ${identifier}`);
    }
}
