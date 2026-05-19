/**
 * Page number field instruction module for WordprocessingML documents.
 *
 * This module provides field instruction elements for displaying
 * page numbers, page counts, and section information.
 *
 * Reference: http://officeopenxml.com/WPfields.php
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { TextAttributes } from "./text-attributes";

/**
 * Represents a PAGE field instruction.
 *
 * Displays the current page number in the document.
 *
 * @example
 * ```typescript
 * new Run({ children: [new Begin(true), new Page(), new End()] });
 * ```
 *
 * @internal
 */
export class Page extends XmlComponent {
    public constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("PAGE");
    }
}

/**
 * Represents a NUMPAGES field instruction.
 *
 * Displays the total number of pages in the document.
 *
 * @internal
 */
export class NumberOfPages extends XmlComponent {
    public constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("NUMPAGES");
    }
}

/**
 * Represents a SECTIONPAGES field instruction.
 *
 * Displays the total number of pages in the current section.
 *
 * @internal
 */
export class NumberOfPagesSection extends XmlComponent {
    public constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("SECTIONPAGES");
    }
}

/**
 * Represents a SECTION field instruction.
 *
 * Displays the current section number.
 *
 * @internal
 */
export class CurrentSection extends XmlComponent {
    public constructor() {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push("SECTION");
    }
}
