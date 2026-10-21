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

    it("should write a password's hash and salt so that Word accepts the password", () => {
        // A salt and hash Word for Mac 16 accepted the password "Example" for
        const salt = [...atob("E7Z4pK9vZJtgEIUrL2UL3w==")].map((character) => character.charCodeAt(0));
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
                    "w:cryptAlgorithmSid": 12,
                    "w:cryptSpinCount": 100000,
                    "w:hash": "MZHm/PwSL2XqNHWnrQFREO8SwF9ZeosDyD3uS3/jbiU=",
                    "w:salt": "E7Z4pK9vZJtgEIUrL2UL3w==",
                },
            },
        });
    });
});
