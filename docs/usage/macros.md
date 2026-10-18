# Macros

<!-- cspell:ignore docm -->

A document can have VBA macros: code that Word runs from its Macros dialog, or when something happens to the document, such as when it opens. A document with macros is a macro-enabled document, saved as a `.docm`.

`createMacros` writes a document's macros from their VBA code. It comes with the `docx` package, from `docx/macros`, and the macros go in the document's `macros`:

```ts
import { Document, Packer, Paragraph } from "docx";
import { createMacros } from "docx/macros";
```

In a page without a bundler, load `dist/macros.umd.cjs` after `dist/index.umd.cjs` (or `dist/macros.iife.js` after `dist/index.iife.js`). It adds a `docxMacros` global, such as `docxMacros.createMacros({ ... })`.

## Example

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { createMacros } from "docx/macros";

const doc = new Document({
    macros: createMacros({
        modules: [
            {
                name: "Greetings",
                code: `
Sub SayHello()
    MsgBox "Hello from docx"
End Sub
`,
            },
        ],
    }),
    sections: [{ children: [new Paragraph("Run SayHello from View > Macros.")] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
```

Save a document with macros as a `.docm`. Word won't open it from a `.docx`, the extension of a document without macros. `Packer.toBlob` gives it a `.docm`'s type, `application/vnd.ms-word.document.macroEnabled.12`.

Word disables the macros of a document from elsewhere until they are enabled, as for any `.docm`. Word for Mac asks when the document opens, and Word for Windows shows a bar with **Enable Content**. Word for Windows [blocks the macros of a file from the internet](https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked), though, such as a `.docm` a web page made and the browser downloaded, without **Enable Content**. To run them, right-click the file, choose **Properties** and tick **Unblock** on the **General** tab. An organization's policy can block macros all the same. Word for the web doesn't run macros.

## Options

| Property       | Type            | Notes    | Description                                                                                                    |
| -------------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `thisDocument` | `string`        | Optional | The code of the document's own module, ThisDocument in the VBA editor, where the document's events are handled |
| `modules`      | `MacroModule[]` | Optional | Modules, with the macros Word lists in its Macros dialog, and the procedures and functions they use            |
| `classModules` | `MacroModule[]` | Optional | Class modules, which define classes of objects                                                                 |

Each module is:

| Property | Type     | Notes    | Description                                                                                               |
| -------- | -------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `name`   | `string` | Required | The module's name, such as `Formatting`. A letter, then letters, digits and underscores, up to 31 of them |
| `code`   | `string` | Required | The module's code, as it is typed in the VBA editor                                                       |

A module can't have the name of another, ignoring case, or a name the project has already: `ThisDocument`, `Project`, and the libraries it uses, `VBA`, `Word`, `stdole`, `Normal` and `Office`.

Word compiles the code when it first runs a macro, so a mistake in it shows then, in the VBA editor.

## The document's events

ThisDocument handles the document's events, such as `Document_Open` when it opens and `Document_Close` when it closes. Word only runs the handler of an event the document lists, and `createMacros` lists those `thisDocument` has.

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { createMacros } from "docx/macros";

const doc = new Document({
    macros: createMacros({
        thisDocument: `
Private Sub Document_Open()
    ActiveDocument.Content.InsertParagraphAfter
    ActiveDocument.Content.InsertAfter "Opened on " & Format(Date, "d mmmm yyyy") & "."
End Sub
`,
    }),
    sections: [{ children: [new Paragraph("Enable macros when Word asks, and the date it opened is added below.")] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
```

## Class modules

A class module defines a class, which code in the other modules makes objects of with `New`:

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";
import { createMacros } from "docx/macros";

const doc = new Document({
    macros: createMacros({
        modules: [
            {
                name: "Counting",
                code: `
Sub CountParagraphs()
    Dim tally As New Counter
    Dim item As Paragraph
    For Each item In ActiveDocument.Paragraphs
        tally.Add
    Next
    MsgBox "This document has " & tally.Value & " paragraphs"
End Sub
`,
            },
        ],
        classModules: [
            {
                name: "Counter",
                code: `
Private count As Long

Public Sub Add()
    count = count + 1
End Sub

Public Property Get Value() As Long
    Value = count
End Property
`,
            },
        ],
    }),
    sections: [{ children: [new Paragraph("Run CountParagraphs from View > Macros."), new Paragraph("This is the second.")] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
```

## Characters in the code

VBA keeps code in Windows-1252, the code page of Word in English and the other Western European languages. It has the accented letters of those languages, and `createMacros` throws for a character it doesn't have. Write one in a string with `ChrW` and its code in hexadecimal instead, such as `ChrW(&H4E2D)` for "中". `ChrW` goes up to `&HFFFF`, so a character beyond that, such as an emoji, is two, its UTF-16 surrogate pair: `ChrW(&HD83D) & ChrW(&HDE00)` for "😀". The error `createMacros` throws gives the `ChrW` to write.

## Macros from a .docm

A `.docm` Word saved keeps its macros in its `word/vbaProject.bin`. A `.docm` is a zip, so the file is in it, as it is in a `.docx`. Give the document it as `macros.project`, with the events its ThisDocument handles:

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    macros: {
        project: fs.readFileSync("./demo/assets/vbaProject.bin"),
        events: ["open"],
    },
    sections: [{ children: [new Paragraph("Enable macros when Word asks, and the document says where its macros came from.")] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docm", buffer);
});
```

The `.docm` lists the events in its `word/vbaData.xml`, in `<wne:docEvents>`:

| Handler in ThisDocument                      | In `events`                           | In `word/vbaData.xml`                     |
| -------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| `Document_New`                               | `"new"`                               | `wne:eventDocNew`                         |
| `Document_Open`                              | `"open"`                              | `wne:eventDocOpen`                        |
| `Document_Close`                             | `"close"`                             | `wne:eventDocClose`                       |
| `Document_Sync`                              | `"sync"`                              | `wne:eventDocSync`                        |
| `Document_XMLAfterInsert`                    | `"xmlAfterInsert"`                    | `wne:eventDocXmlAfterInsert`              |
| `Document_XMLBeforeDelete`                   | `"xmlBeforeDelete"`                   | `wne:eventDocXmlBeforeDelete`             |
| `Document_ContentControlAfterAdd`            | `"contentControlAfterAdd"`            | `wne:eventDocContentControlAfterInsert`   |
| `Document_ContentControlBeforeDelete`        | `"contentControlBeforeDelete"`        | `wne:eventDocContentControlBeforeDelete`  |
| `Document_ContentControlOnExit`              | `"contentControlOnExit"`              | `wne:eventDocContentControlOnExit`        |
| `Document_ContentControlOnEnter`             | `"contentControlOnEnter"`             | `wne:eventDocContentControlOnEnter`       |
| `Document_ContentControlBeforeStoreUpdate`   | `"contentControlBeforeStoreUpdate"`   | `wne:eventDocStoreUpdate`                 |
| `Document_ContentControlBeforeContentUpdate` | `"contentControlBeforeContentUpdate"` | `wne:eventDocContentControlContentUpdate` |
| `Document_BuildingBlockInsert`               | `"buildingBlockInsert"`               | `wne:eventDocBuildingBlockAfterInsert`    |

## Examples

### Macros from their code

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/macros/macros.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/macros/macros.ts_

### Macros from a .docm

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/macros/macros-from-docm.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/macros/macros-from-docm.ts_
