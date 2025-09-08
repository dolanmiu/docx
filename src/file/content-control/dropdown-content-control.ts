import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { IDropdownContentControlOptions } from "./properties";
import { contentControlIdGen } from "./shared-id-generator";
import { validateDataBinding } from "./validation-utils";

/**
 * DropdownContentControl implementation for interactive selection controls.
 *
 * Creates dropdown or combo box Content Controls that provide users with predefined
 * options to choose from. These controls are inline elements ideal for structured
 * data entry where choices should be restricted or guided.
 *
 * Supports two modes:
 * - dropDownList: Users can only select from predefined options (restricted)
 * - comboBox: Users can select from options OR enter custom text (flexible)
 *
 * The control generates OOXML structured document tags (SDT) with specialized
 * dropdown elements that integrate seamlessly with Microsoft Word's selection UI.
 *
 * @example Basic dropdown list
 * ```typescript
 * const priorityControl = new DropdownContentControl({
 *     tag: "TaskPriority",
 *     title: "Task Priority",
 *     type: 'dropDownList',
 *     listItems: [
 *         { displayText: "High Priority", value: "high" },
 *         { displayText: "Medium Priority", value: "medium" },
 *         { displayText: "Low Priority", value: "low" }
 *     ],
 *     children: [new TextRun("Medium Priority")]
 * });
 *
 * const paragraph = new Paragraph({
 *     children: [
 *         new TextRun("Task Priority: "),
 *         priorityControl,
 *         new TextRun(" (select from dropdown)")
 *     ]
 * });
 * ```
 *
 * @example Flexible combo box
 * ```typescript
 * const customerTypeControl = new DropdownContentControl({
 *     tag: "CustomerType",
 *     title: "Customer Type",
 *     type: 'comboBox',
 *     listItems: [
 *         { displayText: "Individual", value: "individual" },
 *         { displayText: "Business", value: "business" },
 *         { displayText: "Government", value: "government" }
 *     ],
 *     placeholder: "Select or enter customer type",
 *     lock: { sdtLocked: true },
 *     children: [new TextRun("Select customer type")]
 * });
 * ```
 */
export class DropdownContentControl extends XmlComponent {
    private readonly tag: string;
    private readonly title?: string;
    private readonly id: number;
    private readonly type: "dropDownList" | "comboBox";
    private readonly listItems: readonly { readonly displayText: string; readonly value: string }[];
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

    /**
     * Creates a new DropdownContentControl instance.
     *
     * @param options - Configuration options for the dropdown content control
     * @throws {Error} When validation fails for the provided options
     */
    public constructor(options: IDropdownContentControlOptions) {
        super("w:sdt");

        // Validate input options
        this.validateOptions(options);

        // Validate data binding GUID format if provided
        if (options.dataBinding) {
            validateDataBinding(options.dataBinding, "DropdownContentControl");
        }

        this.tag = options.tag;
        this.title = options.title;
        this.id = contentControlIdGen();
        this.type = options.type;
        this.listItems = options.listItems;
        this.appearance = options.appearance;
        this.color = options.color;
        this.dataBinding = options.dataBinding;
        this.lock = options.lock;
        this.placeholder = options.placeholder;
        this.multiLine = options.multiLine;
        this.maxLength = options.maxLength;
        this.defaultStyle = options.defaultStyle;

        // Add children to the root array
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
    private validateOptions(options: IDropdownContentControlOptions): void {
        // Validate tag is not empty
        if (!options.tag || options.tag.trim().length === 0) {
            throw new Error(
                "DropdownContentControl: 'tag' is required and cannot be empty. " +
                    "The tag serves as the unique identifier for the dropdown control and is essential for programmatic access. " +
                    "Example: { tag: 'Priority', type: 'dropDownList', listItems: [...] }",
            );
        }

        // Validate type is specified
        if (!options.type) {
            throw new Error(
                "DropdownContentControl: 'type' is required and must be either 'dropDownList' or 'comboBox'. " +
                    "dropDownList restricts users to predefined options, while comboBox allows custom text entry. " +
                    "Example: { type: 'dropDownList', ... }",
            );
        }

        // Validate listItems array
        if (!options.listItems || options.listItems.length === 0) {
            throw new Error(
                "DropdownContentControl: 'listItems' array is required and must contain at least one option. " +
                    "Dropdown controls need predefined options for users to select from. " +
                    "Example: { listItems: [{ displayText: 'Option 1', value: 'opt1' }] }",
            );
        }

        // Validate list items structure
        const invalidItems = options.listItems.filter(
            (item) =>
                !item ||
                typeof item.displayText !== "string" ||
                typeof item.value !== "string" ||
                item.displayText.trim().length === 0 ||
                item.value.trim().length === 0,
        );

        if (invalidItems.length > 0) {
            throw new Error(
                "DropdownContentControl: All listItems must have non-empty 'displayText' and 'value' string properties. " +
                    `Found ${invalidItems.length} invalid item(s). ` +
                    "Example: { displayText: 'High Priority', value: 'high' }",
            );
        }

        // Validate children array
        if (!options.children || options.children.length === 0) {
            throw new Error(
                "DropdownContentControl: 'children' array is required and must contain at least one TextRun element. " +
                    "Dropdown controls need default content to display the current selection. " +
                    "Example: { children: [new TextRun('Select an option')] }",
            );
        }
    }

    /**
     * Generates the OOXML representation of this dropdown content control.
     *
     * This method creates the specialized XML structure required for dropdown controls,
     * including either dropDownList or comboBox elements with their associated list items.
     * The generated XML follows the Office Open XML specification for interactive controls.
     *
     * The generated structure includes:
     * - SDT properties with dropdown-specific elements (w:dropDownList or w:comboBox)
     * - List items with display text and values (w:listItem elements)
     * - All standard content control properties (tag, title, appearance, etc.)
     *
     * @param context - The formatting context provided by the document processor
     * @returns The XML structure representing this dropdown control, or undefined if generation fails
     *
     * @internal This method is called automatically during document generation
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Generate list items for the dropdown
        const listItemElements = this.listItems.map((item) => ({
            "w:listItem": {
                _attr: {
                    "w:displayText": item.displayText,
                    "w:value": item.value,
                },
            },
        }));

        // Generate the dropdown-specific element based on type
        const dropdownElement = this.type === "dropDownList" ? { "w:dropDownList": listItemElements } : { "w:comboBox": listItemElements };

        // Generate the SDT properties section for dropdown control
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
                // Add the dropdown-specific element (dropDownList or comboBox)
                dropdownElement,
                // Add text properties if specified for comboBox
                ...(this.type === "comboBox" && (this.multiLine !== undefined || this.maxLength !== undefined)
                    ? [
                          {
                              "w:text": {
                                  ...(this.multiLine !== undefined
                                      ? { "w:multiLine": { _attr: { "w:val": this.multiLine ? "1" : "0" } } }
                                      : {}),
                                  ...(this.maxLength !== undefined
                                      ? { "w:maxLength": { _attr: { "w:val": this.maxLength.toString() } } }
                                      : {}),
                              },
                          },
                      ]
                    : []),
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

        // Generate the SDT content section by processing children
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

        // Return the complete SDT structure for dropdown control
        return {
            "w:sdt": [sdtPr, sdtContent],
        };
    }
}
