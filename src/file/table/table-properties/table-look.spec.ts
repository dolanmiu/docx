import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { TableLook } from "./table-look";

describe("TableLook", () => {
    describe("#constructor", () => {
        it("should create table look with firstRow enabled", () => {
            const tableLook = new TableLook({
                firstRow: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:firstRow": true,
                    },
                },
            });
        });

        it("should create table look with lastRow enabled", () => {
            const tableLook = new TableLook({
                lastRow: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:lastRow": true,
                    },
                },
            });
        });

        it("should create table look with firstColumn enabled", () => {
            const tableLook = new TableLook({
                firstColumn: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:firstColumn": true,
                    },
                },
            });
        });

        it("should create table look with lastColumn enabled", () => {
            const tableLook = new TableLook({
                lastColumn: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:lastColumn": true,
                    },
                },
            });
        });

        it("should create table look with noHBand enabled", () => {
            const tableLook = new TableLook({
                noHBand: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:noHBand": true,
                    },
                },
            });
        });

        it("should create table look with noVBand enabled", () => {
            const tableLook = new TableLook({
                noVBand: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:noVBand": true,
                    },
                },
            });
        });

        it("should create table look with firstRow set to false", () => {
            const tableLook = new TableLook({
                firstRow: false,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:firstRow": false,
                    },
                },
            });
        });

        it("should create table look with multiple attributes", () => {
            const tableLook = new TableLook({
                firstRow: true,
                firstColumn: true,
                noVBand: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:firstRow": true,
                        "w:firstColumn": true,
                        "w:noVBand": true,
                    },
                },
            });
        });

        it("should create table look with all attributes", () => {
            const tableLook = new TableLook({
                firstRow: true,
                lastRow: false,
                firstColumn: true,
                lastColumn: false,
                noHBand: false,
                noVBand: true,
            });
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {
                        "w:firstRow": true,
                        "w:lastRow": false,
                        "w:firstColumn": true,
                        "w:lastColumn": false,
                        "w:noHBand": false,
                        "w:noVBand": true,
                    },
                },
            });
        });

        it("should create table look with empty options", () => {
            const tableLook = new TableLook({});
            const tree = new Formatter().format(tableLook);
            expect(tree).to.deep.equal({
                "w:tblLook": {
                    _attr: {},
                },
            });
        });
    });
});
