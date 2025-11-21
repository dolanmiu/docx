# Content Controls

Content Controls are structured document tags (SDT) that provide a way to create interactive form fields, data binding regions, and template placeholders in Word documents. They're essential for creating professional forms, templates, and dynamic documents.

## What are Content Controls?

Content Controls are special regions in a Word document that can:
- Display placeholder text to guide users
- Restrict or guide user input
- Bind to data sources for automatic population
- Provide rich interactive experiences (dropdowns, date pickers, checkboxes)
- Protect certain content while allowing editing in designated areas

## Types of Content Controls

### 1. RunContentControl - Inline Text Controls

Use `RunContentControl` for single-line text input that appears within paragraphs.

```typescript
import { Document, Paragraph, TextRun, RunContentControl } from "docx";

const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [
                    new TextRun("Customer Name: "),
                    new RunContentControl({
                        tag: "CustomerName",
                        title: "Customer Name",
                        placeholder: "Enter customer name here",
                        children: [new TextRun("[Enter Name]")]
                    })
                ]
            })
        ]
    }]
});
```

### 2. BlockContentControl - Multi-Paragraph Content

Use `BlockContentControl` for larger content areas that can contain multiple paragraphs, tables, and complex formatting.

```typescript
const addressBlock = new BlockContentControl({
    tag: "CustomerAddress",
    title: "Customer Address",
    appearance: "boundingBox",
    children: [
        new Paragraph({
            children: [new TextRun({ text: "Customer Name", bold: true })]
        }),
        new Paragraph({
            children: [new TextRun("123 Main Street")]
        }),
        new Paragraph({
            children: [new TextRun("City, State 12345")]
        })
    ]
});
```

### 3. DropdownContentControl - Selection Lists

Create dropdown lists and combo boxes for user selection.

```typescript
// Dropdown List (restricted selection)
const priorityDropdown = new DropdownContentControl({
    tag: "TaskPriority",
    title: "Task Priority Level",
    type: "dropDownList",
    listItems: [
        { displayText: "🔴 High Priority", value: "high" },
        { displayText: "🟡 Medium Priority", value: "medium" },
        { displayText: "🟢 Low Priority", value: "low" }
    ],
    children: [new TextRun("Select Priority")]
});

// Combo Box (allows custom input)
const countryCombo = new DropdownContentControl({
    tag: "Country",
    title: "Country Selection", 
    type: "comboBox",
    placeholder: "Select or enter country",
    listItems: [
        { displayText: "United States", value: "us" },
        { displayText: "Canada", value: "ca" },
        { displayText: "United Kingdom", value: "uk" },
        { displayText: "Other", value: "other" }
    ],
    children: [new TextRun("Select Country")]
});
```

### 4. DatePickerContentControl - Date Selection

Provide calendar interfaces for date input with proper formatting.

```typescript
const dueDatePicker = new DatePickerContentControl({
    tag: "ProjectDueDate",
    title: "Project Due Date",
    dateFormat: "MM/dd/yyyy",
    calendarType: "gregorian",
    locale: "en-US",
    defaultDate: new Date(),
    storeMappedDataAs: "dateTime",
    children: [new TextRun("Select Date")]
});

// International date format
const contractDate = new DatePickerContentControl({
    tag: "ContractDate", 
    title: "Contract Execution Date",
    dateFormat: "dd/MM/yyyy",
    locale: "en-GB",
    children: [new TextRun("31/12/2024")]
});
```

### 5. CheckboxContentControl - Binary Choices

Create checkboxes for boolean selections, agreements, or status indicators.

```typescript
const agreementCheckbox = new CheckboxContentControl({
    tag: "TermsAgreement",
    title: "Terms and Conditions Agreement",
    checked: false,
    appearance: "boundingBox",
    children: [] // Checkboxes don't need text children
});

// Custom symbols
const approvalCheckbox = new CheckboxContentControl({
    tag: "DocumentApproval",
    title: "Document Approved",
    checked: true,
    checkedSymbol: { font: "Wingdings", character: "☑" },
    uncheckedSymbol: { font: "Wingdings", character: "☐" },
    color: "009900",
    children: []
});
```

## Common Properties

All content controls share these common properties:

### Basic Properties

```typescript
{
    tag: string,              // Required: Unique identifier for programmatic access
    title?: string,           // Optional: User-friendly name (appears in Word's Developer tools)
    placeholder?: string,     // Optional: Instructional text for users
    appearance?: "boundingBox" | "tags" | "hidden",  // Visual display mode
    color?: string,           // Border color in hex format (e.g., "FF0000" for red)
}
```

### Appearance Options

- **`boundingBox`** (default): Shows a box around the content
- **`tags`**: Shows start/end tags around the content  
- **`hidden`**: No visual indicators

```typescript
const styledControl = new RunContentControl({
    tag: "StyledField",
    title: "Styled Input Field",
    appearance: "tags",
    color: "0066CC", // Blue border
    children: [new TextRun("Enter text")]
});
```

### Locking Properties

Control user interaction with your content controls:

```typescript
const protectedControl = new BlockContentControl({
    tag: "ProtectedSection",
    title: "Protected Content",
    lock: {
        contentLock: true,  // Users cannot edit the content
        sdtLocked: true     // Users cannot delete the control
    },
    children: [new Paragraph("This content is protected")]
});
```

## Advanced Features

### Data Binding

Link content controls to XML data sources for automatic population:

```typescript
const dataBoundControl = new RunContentControl({
    tag: "CustomerData",
    title: "Customer Information",
    dataBinding: {
        xpath: "/root/customer/name",
        storeItemId: "{12345678-1234-5678-9ABC-123456789012}" // Must be valid GUID!
    },
    children: [new TextRun("[Customer Name]")]
});
```

**⚠️ CRITICAL**: The `storeItemId` must be a valid GUID format `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}` or Word will reject the document!

### Text Formatting Properties

For text-based controls, you can specify formatting options:

```typescript
const formattedControl = new RunContentControl({
    tag: "FormattedText",
    title: "Formatted Input",
    multiLine: true,
    maxLength: 250,
    defaultStyle: {
        bold: true,
        color: "FF6600",
        fontSize: 24, // Half-points (12pt = 24)
        fontFamily: "Arial"
    },
    children: [new TextRun("Formatted placeholder")]
});
```

### Nested Content Controls

**IMPORTANT**: To nest content controls inside other content controls, you must enable rich text mode:

```typescript
// ✅ Correct: Rich text mode enables nesting
const parentControl = new RunContentControl({
    tag: "DocumentInfo",
    title: "Document Information", 
    richText: true,  // 🔧 KEY: This enables nesting!
    children: [
        new TextRun("Report Date: "),
        new RunContentControl({
            tag: "ReportDate",
            title: "Report Date",
            children: [new TextRun("[MM/DD/YYYY]")]
        })
    ]
});

// ❌ Wrong: This will throw an error
const errorControl = new RunContentControl({
    tag: "Parent",
    // richText: false (default) - nesting not allowed
    children: [
        new RunContentControl({ ... }) // This causes an error!
    ]
});
```

## Real-World Examples

### 1. Invoice Template

```typescript
const invoiceTemplate = new Document({
    sections: [{
        children: [
            // Header
            new Paragraph({
                children: [
                    new TextRun({ text: "INVOICE", bold: true, size: 32 })
                ]
            }),
            
            // Customer Information Block
            new BlockContentControl({
                tag: "CustomerInfo",
                title: "Customer Information",
                appearance: "boundingBox",
                color: "0066CC",
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "BILL TO:", bold: true })]
                    }),
                    new Paragraph({
                        children: [
                            new RunContentControl({
                                tag: "CustomerName",
                                title: "Customer Name",
                                children: [new TextRun("[Customer Name]")]
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new RunContentControl({
                                tag: "CustomerAddress",
                                title: "Customer Address",
                                multiLine: true,
                                children: [new TextRun("[Customer Address]")]
                            })
                        ]
                    })
                ]
            }),
            
            // Invoice Details
            new Paragraph({
                children: [
                    new TextRun("Invoice Date: "),
                    new DatePickerContentControl({
                        tag: "InvoiceDate",
                        title: "Invoice Date",
                        dateFormat: "MM/dd/yyyy",
                        children: [new TextRun("Select Date")]
                    })
                ]
            }),
            
            new Paragraph({
                children: [
                    new TextRun("Priority: "),
                    new DropdownContentControl({
                        tag: "InvoicePriority",
                        title: "Invoice Priority",
                        type: "dropDownList",
                        listItems: [
                            { displayText: "Standard", value: "standard" },
                            { displayText: "Rush", value: "rush" },
                            { displayText: "Emergency", value: "emergency" }
                        ],
                        children: [new TextRun("Standard")]
                    })
                ]
            })
        ]
    }]
});
```

### 2. Contract Agreement Form

```typescript
const contractForm = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [new TextRun({ text: "SERVICE AGREEMENT", bold: true, size: 28 })]
            }),
            
            // Party Information
            new BlockContentControl({
                tag: "PartyInfo",
                title: "Party Information",
                lock: { sdtLocked: true }, // Prevent accidental deletion
                children: [
                    new Paragraph({
                        children: [
                            new TextRun("This agreement is between "),
                            new RunContentControl({
                                tag: "ClientName",
                                title: "Client Name", 
                                appearance: "tags",
                                children: [new TextRun("[Client Name]")]
                            }),
                            new TextRun(" and "),
                            new RunContentControl({
                                tag: "ProviderName",
                                title: "Service Provider Name",
                                appearance: "tags", 
                                children: [new TextRun("[Provider Name]")]
                            })
                        ]
                    })
                ]
            }),
            
            // Terms Section
            new BlockContentControl({
                tag: "Terms",
                title: "Contract Terms",
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "TERMS AND CONDITIONS", bold: true })]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Service start date: "),
                            new DatePickerContentControl({
                                tag: "StartDate",
                                title: "Service Start Date",
                                children: [new TextRun("Select Date")]
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun("Contract duration: "),
                            new DropdownContentControl({
                                tag: "Duration",
                                title: "Contract Duration",
                                type: "dropDownList",
                                listItems: [
                                    { displayText: "3 months", value: "3m" },
                                    { displayText: "6 months", value: "6m" },
                                    { displayText: "1 year", value: "1y" },
                                    { displayText: "2 years", value: "2y" }
                                ],
                                children: [new TextRun("Select Duration")]
                            })
                        ]
                    })
                ]
            }),
            
            // Agreement Checkbox
            new Paragraph({
                children: [
                    new CheckboxContentControl({
                        tag: "Agreement",
                        title: "Agreement Acceptance",
                        checked: false,
                        color: "009900",
                        children: []
                    }),
                    new TextRun(" I agree to the terms and conditions stated above.")
                ]
            })
        ]
    }]
});
```

### 3. Survey Form

```typescript
const surveyForm = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [new TextRun({ text: "CUSTOMER SATISFACTION SURVEY", bold: true, size: 24 })]
            }),
            
            // Rating Questions
            new Paragraph({
                children: [
                    new TextRun("Overall satisfaction: "),
                    new DropdownContentControl({
                        tag: "OverallRating",
                        title: "Overall Satisfaction Rating",
                        type: "dropDownList",
                        listItems: [
                            { displayText: "⭐⭐⭐⭐⭐ Excellent", value: "5" },
                            { displayText: "⭐⭐⭐⭐ Good", value: "4" },
                            { displayText: "⭐⭐⭐ Average", value: "3" },
                            { displayText: "⭐⭐ Poor", value: "2" },
                            { displayText: "⭐ Very Poor", value: "1" }
                        ],
                        children: [new TextRun("Select Rating")]
                    })
                ]
            }),
            
            // Recommendation
            new Paragraph({
                children: [
                    new TextRun("Would you recommend us? "),
                    new CheckboxContentControl({
                        tag: "WouldRecommend",
                        title: "Would Recommend",
                        checkedSymbol: { font: "Segoe UI Symbol", character: "✓" },
                        uncheckedSymbol: { font: "Segoe UI Symbol", character: "○" },
                        children: []
                    }),
                    new TextRun(" Yes")
                ]
            }),
            
            // Comments Section
            new BlockContentControl({
                tag: "Comments",
                title: "Additional Comments",
                placeholder: "Please share any additional feedback...",
                appearance: "boundingBox",
                children: [
                    new Paragraph({
                        children: [new TextRun("Additional Comments:")]
                    }),
                    new Paragraph({
                        children: [new TextRun("[Your feedback here]")]
                    })
                ]
            })
        ]
    }]
});
```

## Best Practices

### ✅ Do's

1. **Use descriptive tags**: `CustomerName` instead of `Field1`
2. **Provide helpful titles**: They appear in Word's Developer tools
3. **Add placeholder text**: Guide users on what to enter
4. **Use appropriate control types**: 
   - `RunContentControl` for single-line inline text
   - `BlockContentControl` for multi-paragraph content
   - `DropdownContentControl` for selections
   - `DatePickerContentControl` for dates
   - `CheckboxContentControl` for boolean choices

3. **Enable rich text for nesting**: Set `richText: true` when you need to nest controls
4. **Use valid GUIDs for data binding**: Always use proper GUID format
5. **Lock controls appropriately**: Prevent accidental deletion with `sdtLocked: true`

### ❌ Don'ts

1. **Don't use invalid GUIDs**: `{invalid-guid}` will break Word documents
2. **Don't nest without rich text**: Set `richText: true` when nesting controls
3. **Don't use wrong control types**: Don't put paragraphs in `RunContentControl`
4. **Don't forget validation**: Always test your generated documents in Word
5. **Don't ignore appearance**: Good visual design improves user experience

### Common Pitfalls

#### Invalid GUID Formats
```typescript
// ❌ These will break Word documents:
dataBinding: {
    xpath: "/data/field",
    storeItemId: "{invalid-guid}"    // Non-hex characters
}
dataBinding: {
    xpath: "/data/field", 
    storeItemId: "{12345}"           // Wrong length
}

// ✅ Correct GUID format:
dataBinding: {
    xpath: "/data/field",
    storeItemId: "{12345678-1234-5678-9ABC-123456789012}"
}
```

#### Illegal Nesting
```typescript
// ❌ This will throw an error:
new RunContentControl({
    tag: "Parent",
    children: [
        new RunContentControl({ ... }) // Nesting without richText!
    ]
});

// ✅ Enable rich text for nesting:
new RunContentControl({
    tag: "Parent",
    richText: true,  // Enables nesting
    children: [
        new RunContentControl({ ... }) // Now allowed
    ]
});
```

## Integration with Word

Once your document is generated:

1. **Opening in Word**: Content controls will appear with visual indicators based on the `appearance` setting
2. **Developer Tab**: Users can see and modify content control properties
3. **Form Filling**: Users can interact with dropdowns, date pickers, and checkboxes
4. **Data Binding**: If configured, controls can automatically populate from XML data sources
5. **Protection**: Locked controls prevent users from accidentally deleting important form structure

## TypeScript Support

All content control classes are fully typed with comprehensive interfaces:

```typescript
import { 
    RunContentControl, 
    BlockContentControl, 
    DropdownContentControl,
    DatePickerContentControl, 
    CheckboxContentControl,
    IRunContentControlOptions,
    IBlockContentControlOptions 
} from "docx";

// TypeScript will provide full intellisense and validation
const control: RunContentControl = new RunContentControl({
    tag: "TypedControl", // Required
    title: "Typed Control", // Optional with intellisense
    // All properties are type-checked
});
```

This comprehensive content control system enables you to create professional, interactive Word documents with rich form functionality and data binding capabilities.
