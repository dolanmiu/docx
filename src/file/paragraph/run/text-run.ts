import { IRunOptions, Run } from "./run";

/**
 * Represents a text run in a WordprocessingML document.
 *
 * TextRun is a convenience class that extends Run, allowing you to pass
 * either a string or full run options. This is the most common way to
 * add text content to a paragraph.
 *
 * Reference: http://officeopenxml.com/WPtext.php
 *
 * @example
 * ```typescript
 * // Simple text
 * new TextRun("Hello World");
 *
 * // Formatted text
 * new TextRun({ text: "Bold Text", bold: true });
 * ```
 */
export class TextRun extends Run {
    public constructor(options: IRunOptions | string) {
        super(typeof options === "string" ? { text: options } : options);
    }
}
