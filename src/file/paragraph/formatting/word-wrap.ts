/**
 * Word wrap module for WordprocessingML documents.
 *
 * This module provides word wrap settings for paragraphs.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * @see http://officeopenxml.com/WPtableAlignment.php
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates word wrap settings element for a WordprocessingML document.
 *
 * The wordWrap element specifies whether word wrap should be disabled
 * for the paragraph.
 */
export const createWordWrap = (): XmlComponent =>
    new BuilderElement<{ readonly val: 0 }>({
        name: "w:wordWrap",
        attributes: {
            val: { key: "w:val", value: 0 },
        },
    });
