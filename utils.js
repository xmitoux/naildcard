function createPrompt(template, variableMap) {
    const weightRegex = /^(\d+::)?(.+)$/;

    const selectRandomByWeight = (options) => {
        const weights = options.map(option => {
            const weightMatch = weightRegex.exec(option);
            return weightMatch[1] ? parseInt(weightMatch[1].slice(0, -1), 10) : 1;
        });

        const sumOfWeights = weights.reduce((a, b) => a + b);
        const randNum = Math.random() * sumOfWeights;
        let weightSum = 0;

        for (let i = 0; i < weights.length; i++) {
            weightSum += weights[i];
            if (randNum < weightSum) {
                return options[i].replace(weightRegex, "$2");
            }
        }
    }

    let replaceBracketedParams = (value) => {
        let replacedValue = value;
        let oldValue = null;

        while (oldValue !== replacedValue) {
            oldValue = replacedValue;
            replacedValue = oldValue.replace(/\(([^()]+)\)/g, (match, inner) => {
                return selectRandomByWeight(inner.split('|'));
            });
        }

        return replacedValue;
    }

    template = replaceBracketedParams(template);

    Object.keys(variableMap).forEach(key => {
        var re = new RegExp(`__${key}__`, 'g');
        template = template.replace(re, function() {
            return replaceBracketedParams(selectRandomByWeight(variableMap[key]));
        });
    });

    return template;
}

function parseWildcardsString(input) {
    let lines = input.split('\n');
    let output = {};
    let currentKey = null;

    lines.forEach(line => {
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
