import type { DocumentMacroEvent } from 'docx';
import type { DocumentMacros } from 'docx';

/**
 * Writes a document's VBA macros from their code, for the document's `macros`: the VBA project, and the events of the
 * document that ThisDocument's code handles, such as `Document_Open`. The document is then a macro-enabled document,
 * which Word opens from a .docm file. Word asks whether to enable its macros, as for any document with macros from
 * elsewhere.
 *
 * VBA keeps code in Windows-1252, the code page of Word in English and the other Western European languages, so a
 * character it doesn't have goes in a string as `ChrW`, such as `ChrW(&H4E2D)` for "中", or two for a character beyond
 * U+FFFF, such as `ChrW(&HD83D) & ChrW(&HDE00)` for "😀".
 *
 * Word compiles the code when it first runs a macro, so a mistake in it shows then, in the VBA editor.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const doc = new Document({
 *   macros: createMacros({
 *     thisDocument: 'Private Sub Document_Open()\n    MsgBox "Hello"\nEnd Sub',
 *     modules: [{ name: "Formatting", code: "Sub MakeBold()\n    Selection.Font.Bold = True\nEnd Sub" }],
 *   }),
 *   sections: [{ children: [new Paragraph("Hello World")] }],
 * });
 * ```
 *
 * @throws If a module's name isn't a VBA name of up to 31 characters, or is taken: by another module, ignoring case, or
 * by ThisDocument, the project, Project, or a library it uses, VBA, Word, stdole, Normal or Office
 * @returns The document's macros, for its `macros`: the VBA project, and the events of the document it handles
 * @throws If code has a character Windows-1252 doesn't
 */
export declare const createMacros: ({ thisDocument, modules, classModules }?: MacrosOptions) => DocumentMacros & {
    readonly project: Uint8Array;
    readonly events: readonly DocumentMacroEvent[];
};

/**
 * A module of VBA code, as the VBA editor shows it.
 *
 * @publicApi
 */
export declare type MacroModule = {
    /**
     * The module's name, such as "Formatting". A macro in it is "Formatting.MacroName" when the macro's name alone could
     * be another module's too. It starts with a letter, then has letters, digits and underscores, up to 31 of them
     */
    readonly name: string;
    /** The module's code, as it is typed in the VBA editor */
    readonly code: string;
};

/**
 * Options for {@link createMacros}.
 *
 * @publicApi
 */
export declare type MacrosOptions = {
    /**
     * The code of the document's own module, ThisDocument in the VBA editor, where the document's events are handled,
     * such as `Document_Open` when it opens
     */
    readonly thisDocument?: string;
    /** Modules, with the macros Word lists in its Macros dialog, and the procedures and functions they use */
    readonly modules?: readonly MacroModule[];
    /** Class modules, which define classes of objects */
    readonly classModules?: readonly MacroModule[];
};

export { }
