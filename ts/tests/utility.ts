export class Utility {
    public static jsonify(obj: object): any {
        const stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }
}
