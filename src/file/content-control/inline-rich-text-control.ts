import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { IRunContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * InlineRichTextContentControl - An inline content control that supports nesting other content controls.
 *
 * This is the SOLUTION to the nesting problem! Unlike RunContentControl (plain text),
 * this control uses w:richText property which allows it to contain other content controls
 * while still being inline/run-level (can be placed within paragraphs).
 *
 * KEY DIFFERENCES from RunContentControl:
 * - Uses w:richText instead of w:text (enables nesting)
 * - Can contain other content controls, TextRuns, etc.
 * - Still inline (extends XmlComponent, not FileChild)
 *
 * KEY DIFFERENCES from BlockContentControl:
 * - Inline placement (can go inside paragraphs)
 * - Cannot contain paragraphs or tables (only inline elements)
 *
 * @example Nesting content controls (now possible!)
 * ```typescript
 * const nestedControl = new InlineRichTextContentControl({
 *     tag: "DocumentInfo",
 *     title: "Document Information",
 *     children: [
 *         new TextRun("Report Date: "),
 *         new RunContentControl({
 *             tag: "ReportDate",
 *             title: "Report Date",
 *             children: [new TextRun("[MM/DD/YYYY]")]
 *         })
 *     ]
 * });
 *
 * const paragraph = new Paragraph({
 *     children: [
 *         new TextRun("Header: "),
 *         nestedControl,  // Inline rich text with nested controls!
 *         new TextRun(" - End of line")
 *     ]
 * });
 * ```
 */
export class InlineRichTextContentControl extends XmlComponent {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly appearance?: string;
    private readonly color?: string;
    private readonly dataBinding?: { readonly xpath: string; readonly storeItemId: string };
    private readonly lock?: { readonly contentLock?: boolean; readonly sdtLocked?: boolean };
    private readonly placeholder?: string;

    /**
     * Creates a new InlineRichTextContentControl instance.
     *
     * @param options - Configuration options for the inline rich text content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: IRunContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "InlineRichTextContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.appearance = options.appearance;
        this.color = options.color;
        this.dataBinding = options.dataBinding;
        this.lock = options.lock;
        this.placeholder = options.placeholder;

        // Add children using the same logic as RunContentControl
        for (const child of options.children) {
            this.root.push(child);
        }
    }

    /**
     * Validates the constructor options.
     */
    private validateOptions(options: IRunContentControlOptions): void {
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "InlineRichTextContentControl options.tag: Tag is required and cannot be empty. " +
                    "The tag serves as a unique identifier for the content control and is used for " +
                    "programmatic access. Example: { tag: 'CustomerName', children: [...] }",
            );
        }

        if (!Array.isArray(options.children)) {
            throw new Error(
                "InlineRichTextContentControl options.children: Children array is required. " +
                    "Pass an empty array [] if no initial content is needed. " +
                    "Children can include TextRun, RunContentControl, and other inline elements.",
            );
        }
    }

    /**
     * Generates the OOXML representation of this inline rich text content control.
     *
     * KEY DIFFERENCE: Uses w:richText instead of w:text to enable nesting other content controls.
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate SDT properties - CRITICAL: Use w:richText instead of w:text!
        const sdtPr = {
            "w:sdtPr": [
                // Add user-friendly title (appears in Word's Developer tools)
                ...(this.title ? [{ "w:alias": { _attr: { "w:val": this.title } } }] : []),
                // Add machine-readable tag (required - used for programmatic access)
                { "w:tag": { _attr: { "w:val": this.tag } } },
                // Add unique numeric ID (required - used by Word internally)
                { "w:id": { _attr: { "w:val": this.id.toString() } } },
                // Add appearance mode if specified
                ...(this.appearance ? [{ "w:appearance": { _attr: { "w:val": this.appearance } } }] : []),
                // Add border color if specified
                ...(this.color ? [{ "w:color": { _attr: { "w:val": this.color } } }] : []),
                // Add data binding if specified
                ...(this.dataBinding
                    ? [
                          {
                              "w:dataBinding": {
                                  _attr: {
                                      "w:xpath": this.dataBinding.xpath,
                                      "w:storeItemID": this.dataBinding.storeItemId,
                                  },
                              },
                          },
                      ]
                    : []),
                // Add locking properties if specified
                ...(this.lock
                    ? [
                          {
                              "w:lock": {
                                  _attr: {
                                      ...(this.lock.contentLock ? { "w:contentLocked": "1" } : {}),
                                      ...(this.lock.sdtLocked ? { "w:sdtLocked": "1" } : {}),
                                  },
                              },
                          },
                      ]
                    : []),
                // Add placeholder indicator if specified
                ...(this.placeholder ? [{ "w:showingPlcHdr": {} }] : []),
                // 🎯 CRITICAL: Use w:richText instead of w:text to enable nesting!
                { "w:richText": {} },
            ],
        };

        // Generate the SDT content section by processing child elements
        // This processes TextRuns and other inline elements (including nested content controls!)
        const processedChildren = this.root
            .map((child) => child.prepForXml(context))
            .filter((child): child is IXmlableObject => child !== undefined);

        const sdtContent = {
            "w:sdtContent": processedChildren,
        };

        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
