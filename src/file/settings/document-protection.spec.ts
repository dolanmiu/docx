import { afterEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";

import { DocumentProtection, DocumentProtectionType } from "./document-protection";

describe("DocumentProtection", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        [DocumentProtectionType.READ_ONLY, "readOnly"],
        [DocumentProtectionType.COMMENTS, "comments"],
        [DocumentProtectionType.TRACKED_CHANGES, "trackedChanges"],
        [DocumentProtectionType.FORMS, "forms"],
    ])("should enforce %s protection without a password", (type, edit) => {
        const tree = new Formatter().format(new DocumentProtection({ type }));

        expect(tree).to.deep.equal({
            "w:documentProtection": { _attr: { "w:edit": edit, "w:enforcement": true } },
        });
    });

    it("should write no password for an empty one, as Word does", () => {
        const tree = new Formatter().format(new DocumentProtection({ type: DocumentProtectionType.READ_ONLY, password: "" }));

        expect(tree).to.deep.equal({
            "w:documentProtection": { _attr: { "w:edit": "readOnly", "w:enforcement": true } },
        });
    });

    it("should write a password's hash and salt as Word does", () => {
        // The salt Word for Mac 16 chose when it protected a document with the password "Example"
        const salt = [...atob("RtEaIE+V6X78XzRte+874Q==")].map((character) => character.charCodeAt(0));
        vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
            (array as Uint8Array).set(salt);
            return array;
        });

        const tree = new Formatter().format(new DocumentProtection({ type: DocumentProtectionType.READ_ONLY, password: "Example" }));

        expect(tree).to.deep.equal({
            "w:documentProtection": {
                _attr: {
                    "w:edit": "readOnly",
                    "w:enforcement": true,
                    "w:cryptProviderType": "rsaAES",
                    "w:cryptAlgorithmClass": "hash",
                    "w:cryptAlgorithmType": "typeAny",
                    "w:cryptAlgorithmSid": 14,
                    "w:cryptSpinCount": 100000,
                    "w:hash": "P9vAWTa+XzjQvDiLfHPwEWuAhuyAi+3UW3ccWu/IzaMVWJtTZhT6PHyIylX4V5uzUNmKqSlmWIQo0N6pbPwWkQ==",
                    "w:salt": "RtEaIE+V6X78XzRte+874Q==",
                },
            },
        });
    });
});
