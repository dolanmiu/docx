import { Run } from "@file/paragraph/run";
import { Begin, End, Separate } from "@file/paragraph/run/field";
import { SequentialIdentifierInstruction } from "./sequential-identifier-instruction";

export class SequentialIdentifier extends Run {
    public constructor(identifier: string) {
        super({});
        this.root.push(new Begin(true));
        this.root.push(new SequentialIdentifierInstruction(identifier));
        this.root.push(new Separate());
        this.root.push(new End());
    }
}
