import { Run } from "@file/paragraph/run";
import { createBegin, createEnd, createSeparate } from "@file/paragraph/run/field";

import { SequentialIdentifierInstruction } from "./sequential-identifier-instruction";

export class SequentialIdentifier extends Run {
    public constructor(identifier: string) {
        super({});
        this.root.push(createBegin(true));
        this.root.push(new SequentialIdentifierInstruction(identifier));
        this.root.push(createSeparate());
        this.root.push(createEnd());
    }
}
