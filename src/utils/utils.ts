/**
 * wildcardのパース
 */
export function parseWildcardsString(wildcardsStr: string) {
    let output: WildcardMap = {};

    let lines = wildcardsStr.split('\n');

    let currentKey = '';
    lines.forEach((line) => {
        line = line.trim(); // Remove spaces at the beginning and end of the line

        if (!line || /^\s*$/gi.test(line)) {
            // Ignore empty lines or lines contain only spaces
            return;
        } else if (line.endsWith(':')) {
            // This is a key
            currentKey = line.slice(0, -1); // Remove the trailing :
            output[currentKey] = [];
        } else {
            // This is a value
            // Ignore if no valid key is defined yet
            if (currentKey) {
                output[currentKey].push(line);
            }
        }
    });

    return output;
}
