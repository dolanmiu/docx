export class Utility {
    public static jsonify(obj: Object) {
        const stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }
}
