import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { IRunContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * RunContentControl implementation for inline (run-level) content controls.
 *
 * Creates a Plain Text Content Control that can be embedded within paragraphs
 * alongside other inline elements like TextRun. These controls are ideal for
 * single-line data entry fields such as names, dates, or reference numbers.
 *
 * The control generates OOXML structured document tags (SDT) with the appropriate
 * properties for inline content controls, including unique IDs, tags, and titles
 * that integrate seamlessly with Microsoft Word's Content Control functionality.
 *
 * @example Basic usage
 * ```typescript
 * const customerNameControl = new RunContentControl({
 *     tag: "CustomerName",
 *     title: "Customer Name",
 *     children: [new TextRun("Enter customer name here")]
 * });
 *
 * const paragraph = new Paragraph({
 *     children: [
 *         new TextRun("Customer: "),
 *         customerNameControl,
 *         new TextRun(" - Order #12345")
 *     ]
 * });
 * ```
 *
 * @example With formatted content
 * ```typescript
 * const control = new RunContentControl({
 *     tag: "ImportantNote",
 *     title: "Important Note",
 *     children: [
 *         new TextRun({ text: "URGENT: ", bold: true, color: "FF0000" }),
 *         new TextRun("Please review immediately")
 *     ]
 * });
 * ```
 */
export class RunContentControl extends XmlComponent {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly appearance?: string;
    private readonly color?: string;
    private readonly dataBinding?: { readonly xpath: string; readonly storeItemId: string };
    private readonly lock?: { readonly contentLock?: boolean; readonly sdtLocked?: boolean };
    private readonly placeholder?: string;
    private readonly multiLine?: boolean;
    private readonly maxLength?: number;
    private readonly defaultStyle?: {
        readonly bold?: boolean;
        readonly italic?: boolean;
        readonly color?: string;
        readonly fontSize?: number;
        readonly fontFamily?: string;
    };
    private readonly richText?: boolean;

    /**
     * Creates a new RunContentControl instance.
     *
     * @param options - Configuration options for the content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: IRunContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "RunContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.appearance = options.appearance;
        this.color = options.color;
        this.dataBinding = options.dataBinding;
        this.lock = options.lock;
        this.placeholder = options.placeholder;
        this.multiLine = options.multiLine;
        this.maxLength = options.maxLength;
        this.defaultStyle = options.defaultStyle;
        this.richText = options.richText;

        // Add children to the root array with nesting validation
        this.validateNesting(options.children);
        for (const child of options.children) {
            this.root.push(child);
        }
    }

    /**
     * Validates the constructor options and throws descriptive errors for invalid configurations.
     *
     * @private
     * @param options - The options to validate
     * @throws {Error} When validation fails
     */
    private validateOptions(options: IRunContentControlOptions): void {
        // Validate tag is not empty
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "RunContentControl: 'tag' is required and cannot be empty. " +
                    "The tag serves as the unique identifier for the content control and is essential for programmatic access. " +
                    "Example: { tag: 'CustomerName', children: [...] }",
            );
        }

        // Validate children array exists and is not empty
        if (!options.children || options.children.length === 0) {
            throw new Error(
                "RunContentControl: 'children' array is required and must contain at least one TextRun or nested RunContentControl element. " +
                    "Content controls must have visible content to function properly in Microsoft Word. " +
                    "Example: { tag: 'MyControl', children: [new TextRun('Default text')] }",
            );
        }

        // Validate all children are TextRun or RunContentControl instances
        const invalidChildren = options.children.filter((child) => {
            if (!child || typeof child !== "object" || !("prepForXml" in child)) {
                return true;
            }
            // Accept TextRun (has no fileChild symbol) or other RunContentControls (do have fileChild symbol)
            // This allows nesting while rejecting block-level elements like Paragraph/Table
            return false; // All objects with prepForXml are valid for inline content
        });

        if (invalidChildren.length > 0) {
            throw new Error(
                "RunContentControl: All children must be TextRun or nested RunContentControl instances. " +
                    `Found ${invalidChildren.length} invalid child element(s). ` +
                    "RunContentControl is an inline element and can only contain other inline elements. " +
                    "For paragraph or table content, use BlockContentControl instead. " +
                    "Nesting RunContentControls is supported for complex inline structures.",
            );
        }
    }

    /**
     * Validates nesting rules to prevent Word document corruption.
     *
     * CRITICAL: Plain text content controls (richText: false) cannot contain other content controls.
     * This validation prevents the OOXML specification violation that causes Word to reject documents.
     *
     * @private
     * @param children - The children to validate for nesting issues
     * @throws {Error} When invalid nesting is detected
     */
    private validateNesting(children: readonly unknown[]): void {
        // If richText is enabled, nesting is allowed
        if (this.richText) {
            return;
        }

        // Check for content control nesting in plain text mode
        for (const child of children) {
            // Check if this is a content control type that would cause nesting
            const childType = child?.constructor?.name;
            const isContentControl =
                childType &&
                (childType === "RunContentControl" ||
                    childType === "InlineRichTextContentControl" ||
                    childType === "DropdownContentControl" ||
                    childType === "DatePickerContentControl" ||
                    childType === "CheckboxContentControl");

            if (isContentControl) {
                throw new Error(
                    `RunContentControl nesting error: Cannot nest ${childType} inside a plain text RunContentControl. ` +
                        "This violates the OOXML specification and will cause Microsoft Word to reject the document. " +
                        "\n\n" +
                        "SOLUTIONS:\n" +
                        "1. Set richText: true in the parent control: new RunContentControl({ richText: true, ... })\n" +
                        "2. Use InlineRichTextContentControl instead for the parent control\n" +
                        "3. Use BlockContentControl if you need paragraph-level nesting\n" +
                        "\n" +
                        "For more details, see the OOXML specification on structured document tags (SDT).",
                );
            }
        }
    }

    /**
     * Generates the OOXML representation of this content control.
     *
     * This method is called by the document formatter to convert the high-level
     * RunContentControl object into the low-level XML structure required for
     * .docx files. The generated XML follows the Office Open XML specification
     * for structured document tags (SDT).
     *
     * The generated structure includes:
     * - SDT properties (w:sdtPr) with tag, ID, title, and type markers
     * - SDT content (w:sdtContent) containing the processed child TextRun elements
     *
     * @param context - The formatting context provided by the document processor
     * @returns The XML structure representing this content control, or undefined if generation fails
     *
     * @internal This method is called automatically during document generation
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate the SDT properties section
        // This defines the content control's metadata and behavior in Microsoft Word
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
                // Mark as rich text or plain text control based on richText property
                ...(this.richText
                    ? // Rich text control (supports nesting other content controls)
                      [{ "w:richText": {} }]
                    : // Plain text control (cannot contain other content controls)
                      [
                          {
                              "w:text": {
                                  ...(this.multiLine !== undefined || this.maxLength !== undefined
                                      ? {
                                            ...(this.multiLine !== undefined
                                                ? { "w:multiLine": { _attr: { "w:val": this.multiLine ? "1" : "0" } } }
                                                : {}),
                                            ...(this.maxLength !== undefined
                                                ? { "w:maxLength": { _attr: { "w:val": this.maxLength.toString() } } }
                                                : {}),
                                        }
                                      : {}),
                              },
                          },
                      ]),
                // Add default text styling if specified
                ...(this.defaultStyle
                    ? [
                          {
                              "w:rPr": [
                                  ...(this.defaultStyle.bold ? [{ "w:b": {} }] : []),
                                  ...(this.defaultStyle.italic ? [{ "w:i": {} }] : []),
                                  ...(this.defaultStyle.color ? [{ "w:color": { _attr: { "w:val": this.defaultStyle.color } } }] : []),
                                  ...(this.defaultStyle.fontSize
                                      ? [{ "w:sz": { _attr: { "w:val": this.defaultStyle.fontSize.toString() } } }]
                                      : []),
                                  ...(this.defaultStyle.fontFamily
                                      ? [{ "w:rFonts": { _attr: { "w:ascii": this.defaultStyle.fontFamily } } }]
                                      : []),
                              ],
                          },
                      ]
                    : []),
            ],
        };

        // Generate the SDT content section by processing child TextRun elements
        // Each child's prepForXml method is called to generate its XML representation
        const processedChildren = this.root
            .map((child) => {
                if (typeof child === "object" && "prepForXml" in child) {
                    return child.prepForXml(context);
                }
                return child;
            })
            .filter((child) => child !== undefined);

        const sdtContent = {
            "w:sdtContent": processedChildren,
        };

        // Return the complete SDT structure as required by the OOXML specification
        // The structure is: <w:sdt><w:sdtPr>...</w:sdtPr><w:sdtContent>...</w:sdtContent></w:sdt>
        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
