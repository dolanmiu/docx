// tslint:disable:no-string-literal

import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { ContentTypes } from "./content-types";

describe("ContentTypes", () => {
    let contentTypes: ContentTypes;

    beforeEach(() => {
        contentTypes = new ContentTypes();
    });

    describe("#constructor()", () => {
        it("should create default content types", () => {
            const tree = new Formatter().format(contentTypes);

            expect(tree["Types"]).to.be.an.instanceof(Array);

            expect(tree["Types"][0]).to.deep.equal({ _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/content-types" } });
            expect(tree["Types"][1]).to.deep.equal({ Default: { _attr: { ContentType: "image/png", Extension: "png" } } });
            expect(tree["Types"][2]).to.deep.equal({ Default: { _attr: { ContentType: "image/jpeg", Extension: "jpeg" } } });
            expect(tree["Types"][3]).to.deep.equal({ Default: { _attr: { ContentType: "image/jpeg", Extension: "jpg" } } });
            expect(tree["Types"][4]).to.deep.equal({ Default: { _attr: { ContentType: "image/bmp", Extension: "bmp" } } });
            expect(tree["Types"][5]).to.deep.equal({ Default: { _attr: { ContentType: "image/gif", Extension: "gif" } } });
            expect(tree["Types"][6]).to.deep.equal({
                Default: { _attr: { ContentType: "application/vnd.openxmlformats-package.relationships+xml", Extension: "rels" } },
            });
            expect(tree["Types"][7]).to.deep.equal({ Default: { _attr: { ContentType: "application/xml", Extension: "xml" } } });
            expect(tree["Types"][8]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                        PartName: "/word/document.xml",
                    },
                },
            });
            expect(tree["Types"][9]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
                        PartName: "/word/styles.xml",
                    },
                },
            });
            expect(tree["Types"][10]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-package.core-properties+xml",
                        PartName: "/docProps/core.xml",
                    },
                },
            });
            expect(tree["Types"][11]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.custom-properties+xml",
                        PartName: "/docProps/custom.xml",
                    },
                },
            });
            expect(tree["Types"][12]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.extended-properties+xml",
                        PartName: "/docProps/app.xml",
                    },
                },
            });
            expect(tree["Types"][13]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml",
                        PartName: "/word/numbering.xml",
                    },
                },
            });
            expect(tree["Types"][14]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml",
                        PartName: "/word/footnotes.xml",
                    },
                },
            });
            expect(tree["Types"][15]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml",
                        PartName: "/word/settings.xml",
                    },
                },
            });
        });
    });

    describe("#addFooter()", () => {
        it("should add footer", () => {
            contentTypes.addFooter(101);
            contentTypes.addFooter(102);
            const tree = new Formatter().format(contentTypes);

            expect(tree["Types"][17]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
                        PartName: "/word/footer101.xml",
                    },
                },
            });

            expect(tree["Types"][18]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",
                        PartName: "/word/footer102.xml",
                    },
                },
            });
        });
    });

    describe("#addHeader()", () => {
        it("should add header", () => {
            contentTypes.addHeader(201);
            contentTypes.addHeader(202);
            const tree = new Formatter().format(contentTypes);

            expect(tree["Types"][17]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
                        PartName: "/word/header201.xml",
                    },
                },
            });

            expect(tree["Types"][18]).to.deep.equal({
                Override: {
                    _attr: {
                        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
                        PartName: "/word/header202.xml",
                    },
                },
            });
        });
    });
});
