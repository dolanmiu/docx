/**
 * Compiler module for converting File objects into OOXML ZIP archives.
 *
 * @module
 */
import JSZip from "jszip";
import xml from "xml";

import type { File } from "@file/file";
import { obfuscate } from "@file/fonts/obfuscate-ttf-to-odttf";
import type { PackagePart } from "@file/package-part/package-part";
import { Relationships } from "@file/relationships";
import type { XmlComponent } from "@file/xml-components";
import { encodeUtf8 } from "@util/convenience-functions";

import { Formatter } from "../formatter";
import { ImageReplacer } from "./image-replacer";
import { NumberingReplacer } from "./numbering-replacer";
import type { PrettifyType } from "./packer";

/**
 * Represents a serialized XML file with its path in the OOXML package.
 *
 * @property data - The XML content as a string
 * @property path - The file path within the ZIP archive (e.g., "word/document.xml")
 */
export type IXmlifyedFile = {
    readonly data: string;
    readonly path: string;
};

/**
 * A part that something in the document adds to the package, such as a chart or its embedded workbook, or the
 * relationships of one. An embedded package is zipped while the document is.
 */
type IPackagePartFile = {
    readonly data: string | Uint8Array | Promise<Uint8Array>;
    readonly path: string;
};

/**
 * Complete mapping of all XML files in an OOXML document package.
 *
 * This type represents the full structure of a .docx file, including the main
 * document, styles, relationships, headers, footers, and metadata files.
 */
type IXmlifyedFileMapping = {
    /** Main document content (word/document.xml) */
    readonly Document: IXmlifyedFile;
    /** Style definitions (word/styles.xml) */
    readonly Styles: IXmlifyedFile;
    /** Core document properties (docProps/core.xml) */
    readonly Properties: IXmlifyedFile;
    /** Numbering definitions (word/numbering.xml) */
    readonly Numbering: IXmlifyedFile;
    /** Document relationships (word/_rels/document.xml.rels) */
    readonly Relationships: IXmlifyedFile;
    /** Package-level relationships (_rels/.rels) */
    readonly FileRelationships: IXmlifyedFile;
    /** Header content files */
    readonly Headers: readonly IXmlifyedFile[];
    /** Footer content files */
    readonly Footers: readonly IXmlifyedFile[];
    /** Header relationship files */
    readonly HeaderRelationships: readonly IXmlifyedFile[];
    /** Footer relationship files */
    readonly FooterRelationships: readonly IXmlifyedFile[];
    /** Content types mapping ([Content_Types].xml) */
    readonly ContentTypes: IXmlifyedFile;
    /** Custom document properties (docProps/custom.xml) */
    readonly CustomProperties: IXmlifyedFile;
    /** Application properties (docProps/app.xml) */
    readonly AppProperties: IXmlifyedFile;
    /** Footnotes content (word/footnotes.xml) */
    readonly FootNotes: IXmlifyedFile;
    /** Footnotes relationships (word/_rels/footnotes.xml.rels) */
    readonly FootNotesRelationships: IXmlifyedFile;
    /** Endnotes content (word/endnotes.xml) */
    readonly Endnotes: IXmlifyedFile;
    /** Endnotes relationships (word/_rels/endnotes.xml.rels) */
    readonly EndnotesRelationships: IXmlifyedFile;
    /** Document settings (word/settings.xml) */
    readonly Settings: IXmlifyedFile;
    /** Comments content (word/comments.xml) */
    readonly Comments?: IXmlifyedFile;
    /** Comments relationships (word/_rels/comments.xml.rels) */
    readonly CommentsRelationships?: IXmlifyedFile;
    /** Comments extended for reply threading (word/commentsExtended.xml) */
    readonly CommentsExtended?: IXmlifyedFile;
    /** Durable comment ids (word/commentsIds.xml) */
    readonly CommentsIds?: IXmlifyedFile;
    /** Font table (word/fontTable.xml) */
    readonly FontTable?: IXmlifyedFile;
    /** Font table relationships (word/_rels/fontTable.xml.rels) */
    readonly FontTableRelationships?: IXmlifyedFile;
    /** Theme (word/theme/theme1.xml) */
    readonly Theme: IXmlifyedFile;
    /** Parts added by the document's content, such as charts (word/charts/chart1.xml), and their relationships */
    readonly PackageParts: readonly IPackagePartFile[];
};

/**
 * Compiles File objects into OOXML-compliant ZIP archives.
 *
 * The Compiler is responsible for converting the internal document representation
 * into the complete set of XML files required for a .docx document, managing
 * relationships, images, fonts, and all other document components.
 *
 * @example
 * ```typescript
 * const compiler = new Compiler();
 * const zip = compiler.compile(file, PrettifyType.WITH_2_BLANKS);
 * ```
 */
export class Compiler {
    private readonly formatter: Formatter;
    private readonly imageReplacer: ImageReplacer;
    private readonly numberingReplacer: NumberingReplacer;

    /**
     * Creates a new Compiler instance.
     *
     * Initializes the formatter and replacer utilities used during compilation.
     */
    public constructor() {
        this.formatter = new Formatter();
        this.imageReplacer = new ImageReplacer();
        this.numberingReplacer = new NumberingReplacer();
    }

    /**
     * Compiles a File object into a JSZip archive containing the complete OOXML package.
     *
     * This method orchestrates the entire compilation process:
     * - Converts all document components to XML
     * - Manages image and numbering placeholder replacements
     * - Creates relationship files
     * - Packages fonts and media files
     * - Assembles everything into a ZIP archive
     *
     * @param file - The document to compile
     * @param prettifyXml - Optional XML formatting style
     * @param overrides - Optional custom XML file overrides
     * @returns A JSZip instance containing the complete .docx package
     */
    public compile(
        file: File,
        prettifyXml?: (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): JSZip {
        const zip = new JSZip();
        const { PackageParts: packageParts, ...xmlifiedFileMapping } = this.xmlifyFile(file, prettifyXml);
        const map = new Map<string, IXmlifyedFile | readonly IXmlifyedFile[]>(Object.entries(xmlifiedFileMapping));

        for (const [, obj] of map) {
            if (Array.isArray(obj)) {
                for (const subFile of obj as readonly IXmlifyedFile[]) {
                    zip.file(subFile.path, encodeUtf8(subFile.data));
                }
            } else {
                zip.file((obj as IXmlifyedFile).path, encodeUtf8((obj as IXmlifyedFile).data));
            }
        }

        for (const { path, data } of packageParts) {
            zip.file(path, typeof data === "string" ? encodeUtf8(data) : data);
        }

        for (const subFile of overrides) {
            zip.file(subFile.path, encodeUtf8(subFile.data));
        }

        for (const data of file.Media.Array) {
            if (data.type !== "svg") {
                zip.file(`word/media/${data.fileName}`, data.data);
            } else {
                zip.file(`word/media/${data.fileName}`, data.data);
                zip.file(`word/media/${data.fallback.fileName}`, data.fallback.data);
            }
        }

        // Sequential filenames (font1.odttf, font2.odttf, …) — must match the
        // Target paths set in FontWrapper. Word rejects embedded-font paths
        // containing spaces or non-ASCII when those characters appear in the
        // package zip entry; see https://github.com/dolanmiu/docx/issues/3019.
        for (const [i, { data: buffer, fontKey }] of file.FontTable.fontOptionsWithKey.entries()) {
            zip.file(`word/fonts/font${i + 1}.odttf`, obfuscate(buffer, fontKey));
        }

        return zip;
    }

    private xmlifyFile(file: File, prettify?: (typeof PrettifyType)[keyof typeof PrettifyType]): IXmlifyedFileMapping {
        const documentRelationshipCount = file.Document.Relationships.RelationshipCount + 1;

        const documentXmlData = xml(
            this.formatter.format(file.Document.View, {
                viewWrapper: file.Document,
                file,
                stack: [],
            }),
            {
                indent: prettify,
                declaration: {
                    standalone: "yes",
                    encoding: "UTF-8",
                },
            },
        );

        const commentRelationshipCount = file.Comments.Relationships.RelationshipCount + 1;
        const commentXmlData = xml(
            this.formatter.format(file.Comments, {
                viewWrapper: {
                    View: file.Comments,
                    Relationships: file.Comments.Relationships,
                },
                file,
                stack: [],
            }),
            {
                indent: prettify,
                declaration: {
                    standalone: "yes",
                    encoding: "UTF-8",
                },
            },
        );

        const footnoteRelationshipCount = file.FootNotes.Relationships.RelationshipCount + 1;
        const footnoteXmlData = xml(
            this.formatter.format(file.FootNotes.View, {
                viewWrapper: file.FootNotes,
                file,
                stack: [],
            }),
            {
                indent: prettify,
                declaration: {
                    standalone: "yes",
                    encoding: "UTF-8",
                },
            },
        );

        const documentMediaDatas = this.imageReplacer.getMediaData(documentXmlData, file.Media);
        const commentMediaDatas = this.imageReplacer.getMediaData(commentXmlData, file.Media);
        const footnoteMediaDatas = this.imageReplacer.getMediaData(footnoteXmlData, file.Media);

        return {
            Relationships: {
                data: (() => {
                    documentMediaDatas.forEach((mediaData, i) => {
                        file.Document.Relationships.addRelationship(
                            documentRelationshipCount + i,
                            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                            `media/${mediaData.fileName}`,
                        );
                    });

                    file.Document.Relationships.addRelationship(
                        file.Document.Relationships.RelationshipCount + 1,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable",
                        "fontTable.xml",
                    );

                    return xml(
                        this.formatter.format(file.Document.Relationships, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    );
                })(),
                path: "word/_rels/document.xml.rels",
            },
            Document: {
                data: (() => {
                    const xmlData = this.imageReplacer.replace(documentXmlData, documentMediaDatas, documentRelationshipCount);
                    const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);
                    return referenedXmlData;
                })(),
                path: "word/document.xml",
            },
            Styles: {
                data: (() => {
                    const xmlStyles = xml(
                        this.formatter.format(file.Styles, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                standalone: "yes",
                                encoding: "UTF-8",
                            },
                        },
                    );
                    const referencedXmlStyles = this.numberingReplacer.replace(xmlStyles, file.Numbering.ConcreteNumbering);
                    return referencedXmlStyles;
                })(),
                path: "word/styles.xml",
            },
            Properties: {
                data: xml(
                    this.formatter.format(file.CoreProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/core.xml",
            },
            Numbering: {
                data: xml(
                    this.formatter.format(file.Numbering, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/numbering.xml",
            },
            FileRelationships: {
                data: xml(
                    this.formatter.format(file.FileRelationships, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "_rels/.rels",
            },
            HeaderRelationships: file.Headers.map((headerWrapper, index) => {
                const xmlData = xml(
                    this.formatter.format(headerWrapper.View, {
                        viewWrapper: headerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    headerWrapper.Relationships.addRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(
                        this.formatter.format(headerWrapper.Relationships, {
                            viewWrapper: headerWrapper,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ),
                    path: `word/_rels/header${index + 1}.xml.rels`,
                };
            }),
            FooterRelationships: file.Footers.map((footerWrapper, index) => {
                const xmlData = xml(
                    this.formatter.format(footerWrapper.View, {
                        viewWrapper: footerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(xmlData, file.Media);

                mediaDatas.forEach((mediaData, i) => {
                    footerWrapper.Relationships.addRelationship(
                        i,
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        `media/${mediaData.fileName}`,
                    );
                });

                return {
                    data: xml(
                        this.formatter.format(footerWrapper.Relationships, {
                            viewWrapper: footerWrapper,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ),
                    path: `word/_rels/footer${index + 1}.xml.rels`,
                };
            }),
            Headers: file.Headers.map((headerWrapper, index) => {
                const tempXmlData = xml(
                    this.formatter.format(headerWrapper.View, {
                        viewWrapper: headerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);

                return {
                    data: referenedXmlData,
                    path: `word/header${index + 1}.xml`,
                };
            }),
            Footers: file.Footers.map((footerWrapper, index) => {
                const tempXmlData = xml(
                    this.formatter.format(footerWrapper.View, {
                        viewWrapper: footerWrapper,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                );
                const mediaDatas = this.imageReplacer.getMediaData(tempXmlData, file.Media);
                // TODO: 0 needs to be changed when headers get relationships of their own
                const xmlData = this.imageReplacer.replace(tempXmlData, mediaDatas, 0);

                const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);

                return {
                    data: referenedXmlData,
                    path: `word/footer${index + 1}.xml`,
                };
            }),
            CustomProperties: {
                data: xml(
                    this.formatter.format(file.CustomProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/custom.xml",
            },
            AppProperties: {
                data: xml(
                    this.formatter.format(file.AppProperties, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "docProps/app.xml",
            },
            FootNotes: {
                data: (() => {
                    const xmlData = this.imageReplacer.replace(footnoteXmlData, footnoteMediaDatas, footnoteRelationshipCount);
                    const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);
                    return referenedXmlData;
                })(),
                path: "word/footnotes.xml",
            },
            FootNotesRelationships: {
                data: (() => {
                    footnoteMediaDatas.forEach((mediaData, i) => {
                        file.FootNotes.Relationships.addRelationship(
                            footnoteRelationshipCount + i,
                            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                            `media/${mediaData.fileName}`,
                        );
                    });
                    return xml(
                        this.formatter.format(file.FootNotes.Relationships, {
                            viewWrapper: file.FootNotes,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    );
                })(),
                path: "word/_rels/footnotes.xml.rels",
            },
            Endnotes: {
                data: xml(
                    this.formatter.format(file.Endnotes.View, {
                        viewWrapper: file.Endnotes,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/endnotes.xml",
            },
            EndnotesRelationships: {
                data: xml(
                    this.formatter.format(file.Endnotes.Relationships, {
                        viewWrapper: file.Endnotes,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/_rels/endnotes.xml.rels",
            },
            Settings: {
                data: xml(
                    this.formatter.format(file.Settings, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/settings.xml",
            },
            ...(file.Comments.IsEmpty
                ? {}
                : {
                      Comments: {
                          data: (() => {
                              const xmlData = this.imageReplacer.replace(commentXmlData, commentMediaDatas, commentRelationshipCount);
                              const referenedXmlData = this.numberingReplacer.replace(xmlData, file.Numbering.ConcreteNumbering);
                              return referenedXmlData;
                          })(),
                          path: "word/comments.xml",
                      },
                      CommentsRelationships: {
                          data: (() => {
                              commentMediaDatas.forEach((mediaData, i) => {
                                  file.Comments.Relationships.addRelationship(
                                      commentRelationshipCount + i,
                                      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                                      `media/${mediaData.fileName}`,
                                  );
                              });
                              return xml(
                                  this.formatter.format(file.Comments.Relationships, {
                                      viewWrapper: {
                                          View: file.Comments,
                                          Relationships: file.Comments.Relationships,
                                      },
                                      file,
                                      stack: [],
                                  }),
                                  {
                                      indent: prettify,
                                      declaration: {
                                          encoding: "UTF-8",
                                      },
                                  },
                              );
                          })(),
                          path: "word/_rels/comments.xml.rels",
                      },
                  }),
            ...(file.CommentsExtended
                ? {
                      CommentsExtended: {
                          data: xml(
                              this.formatter.format(file.CommentsExtended, {
                                  viewWrapper: {
                                      View: file.CommentsExtended,
                                      Relationships: file.Comments.Relationships,
                                  },
                                  file,
                                  stack: [],
                              }),
                              {
                                  indent: prettify,
                                  declaration: {
                                      standalone: "yes",
                                      encoding: "UTF-8",
                                  },
                              },
                          ),
                          path: "word/commentsExtended.xml",
                      },
                  }
                : {}),
            ...(file.CommentsIds
                ? {
                      CommentsIds: {
                          data: xml(
                              this.formatter.format(file.CommentsIds, {
                                  viewWrapper: {
                                      View: file.CommentsIds,
                                      Relationships: file.Comments.Relationships,
                                  },
                                  file,
                                  stack: [],
                              }),
                              {
                                  indent: prettify,
                                  declaration: {
                                      standalone: "yes",
                                      encoding: "UTF-8",
                                  },
                              },
                          ),
                          path: "word/commentsIds.xml",
                      },
                  }
                : {}),
            FontTable: {
                data: xml(
                    this.formatter.format(file.FontTable.View, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/fontTable.xml",
            },
            FontTableRelationships: {
                data: (() =>
                    xml(
                        this.formatter.format(file.FontTable.Relationships, {
                            viewWrapper: file.Document,
                            file,
                            stack: [],
                        }),
                        {
                            indent: prettify,
                            declaration: {
                                encoding: "UTF-8",
                            },
                        },
                    ))(),
                path: "word/_rels/fontTable.xml.rels",
            },
            Theme: {
                data: xml(
                    this.formatter.format(file.Theme, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            standalone: "yes",
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "word/theme/theme1.xml",
            },
            // After every part that can refer to them, which adds them to the package as it is written
            PackageParts: this.xmlifyPackageParts(file, prettify),
            // Last, as parts are added to the package, with their content types, while the others are written
            ContentTypes: {
                data: xml(
                    this.formatter.format(file.ContentTypes, {
                        viewWrapper: file.Document,
                        file,
                        stack: [],
                    }),
                    {
                        indent: prettify,
                        declaration: {
                            encoding: "UTF-8",
                        },
                    },
                ),
                path: "[Content_Types].xml",
            },
        };
    }

    /**
     * Writes the parts added to the package while the document's parts were written, such as charts. A part's XML can
     * add parts of its own, such as a chart's embedded workbook, so the parts added meanwhile are written after.
     *
     * @param from - How many of the parts have been written
     */
    private xmlifyPackageParts(
        file: File,
        prettify: (typeof PrettifyType)[keyof typeof PrettifyType] | undefined,
        from: number = 0,
    ): readonly IPackagePartFile[] {
        const parts = file.PackageParts.Array.slice(from);
        if (parts.length === 0) {
            return [];
        }
        return [
            ...parts.flatMap(({ part, path }) => this.xmlifyPackagePart(file, part, path, prettify)),
            ...this.xmlifyPackageParts(file, prettify, from + parts.length),
        ];
    }

    private xmlifyPackagePart(
        file: File,
        part: PackagePart,
        path: string,
        prettify: (typeof PrettifyType)[keyof typeof PrettifyType] | undefined,
    ): readonly IPackagePartFile[] {
        const { content } = part.options;
        if (content instanceof Uint8Array) {
            return [{ data: content, path: `word/${path}` }];
        }

        if ("files" in content) {
            const embedded = new JSZip();
            for (const { path: filePath, content: fileContent } of content.files) {
                embedded.file(
                    filePath,
                    fileContent instanceof Uint8Array
                        ? fileContent
                        : encodeUtf8(this.xmlifyPart(file, fileContent, prettify, new Relationships())),
                );
            }
            return [{ data: embedded.generateAsync({ type: "uint8array", compression: "DEFLATE" }), path: `word/${path}` }];
        }

        // Relationships added while the XML is written, such as to a chart's workbook, are relative to the part's folder
        const relationships = file.PackageParts.createRelationships(path);
        const data = this.xmlifyPart(file, content, prettify, relationships);
        const folder = path.slice(0, path.lastIndexOf("/"));
        const name = path.slice(path.lastIndexOf("/") + 1);
        return [
            { data, path: `word/${path}` },
            ...(relationships.RelationshipCount > 0
                ? [
                      {
                          data: this.xmlifyPart(file, relationships, prettify, relationships, false),
                          path: `word/${folder}/_rels/${name}.rels`,
                      },
                  ]
                : []),
        ];
    }

    /**
     * Formats a part's XML, with the relationships that anything in it that refers to other parts adds to.
     */
    private xmlifyPart(
        file: File,
        content: XmlComponent,
        prettify: (typeof PrettifyType)[keyof typeof PrettifyType] | undefined,
        relationships: Relationships,
        standalone: boolean = true,
    ): string {
        return xml(this.formatter.format(content, { viewWrapper: { View: content, Relationships: relationships }, file, stack: [] }), {
            indent: prettify,
            declaration: standalone ? { standalone: "yes", encoding: "UTF-8" } : { encoding: "UTF-8" },
        });
    }
}
