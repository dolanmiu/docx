export class Utility {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static jsonify(obj: object): any {
        const stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }
}
