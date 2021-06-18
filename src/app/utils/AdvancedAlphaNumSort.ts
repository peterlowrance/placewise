
export class AdvancedAlphaNumSort {
    // Also accounts for fractions - ASSUMES CORRECTLY FORMATTED
    private static translateToNumber(str: string): number {
        let index = 0;
        let detectedSlash = -1;
        let detectedSpace = -1;

        for(let index = 0; index < str.length; index++){
            if(str[index] === '/'){
                detectedSlash = index;
                break;
            } 

            else if(str[index] === ' '){
                detectedSpace = index;
            }

            // If we detect a decimal, immediately parse it to a float and return
            else if (str[index] === '.'){
                return Number.parseFloat(str);
            }
        }

        if(detectedSlash > -1){
            if(detectedSpace > -1){
                return Number.parseInt(str.substring(0, detectedSpace)) + 
                (Number.parseInt(str.substring(detectedSpace+1, detectedSlash)) / Number.parseInt(str.substring(detectedSlash+1)));
            }
            else {
                return Number.parseInt(str.substring(0, detectedSlash)) / Number.parseInt(str.substring(detectedSlash+1));
            }
        }

        return Number.parseInt(str);
    }

    // We need to know if there was a decimal because that's the thing that can cause problems if we can't see far enough back
    private static scanNumber(str: string, startingIndex: number, hangingDecimal: boolean = false) : {hangingDecimal?: boolean, includeStartingDecimal?: boolean, length: number }{
        let index = 0;
        let char;
        let seenDecimal = startingIndex > 0 ? (str[startingIndex-1] === '.') : false;
        let seenSlash = startingIndex > 0 ? (str[startingIndex-1] === '/') : false;
        let seenSpace = false;
        let lastWasNumber = false;
        let firstNumberLength = 0;

        for(; index < str.length; index++){
            char = str[index + startingIndex];

            if(char === ' '){
                if(!lastWasNumber){
                    // x. or x/ in any set is not good, return first number detected
                    return {length: firstNumberLength};
                }
                else {
                    if(seenSpace){
                        if(seenSlash){
                            // x x/x  is a vaild fraction, return everything
                            return {length: index};
                        }
                        else {
                            // Covers when we have x x or x with two trailing spaces, return first number 
                            return { length: firstNumberLength};
                        }
                    }
                    else if(seenSlash){
                        // Getting here means we have a complete expression like x/x or have the number at the end of a slash like /x.x or /x
                        return {length: index};
                    }
                    else if(seenDecimal){
                        if(hangingDecimal){
                            // This could only be ".x " because ".x." will get caught by decimal logic
                            // return as a whole number since there were other connected decimals like x.x.x
                            return {length: index};
                        }
                        else {
                            // This means we have something like ".x " or "x.x ", which will be interpreted as a decimal
                            return {includeStartingDecimal: true, length: index};
                        }
                    }
                    else {
                        // A number followed by a space. Keep on scanning as we may have a fraction following it.
                        firstNumberLength = index;
                        seenSpace = true;
                        lastWasNumber = false;
                    }
                }
            }
            else if(char === '.'){
                if(!lastWasNumber){
                    // x.. or x/. in any set is not good, return first number detected
                    return {length: firstNumberLength};
                }
                else {
                    if(seenSlash){
                        if(!seenSpace && !seenDecimal){
                            // For /x. continue, we may be building the tail end of a decimal
                            firstNumberLength = index;
                            seenDecimal = true;
                            lastWasNumber = false;
                        }
                        else {
                            // x x/x. or x/x. or /x.x. means return first number
                            return {length: firstNumberLength};
                        }
                    }
                    else if(seenDecimal){
                        if(firstNumberLength > 0){
                            // x.x. return front number
                            return {length: firstNumberLength};
                        }
                        else {
                            // .x. return number with hanging decimal
                            return {hangingDecimal: true, length: index};
                        }
                    }
                    else if(seenSpace){
                        // x x. return first number
                        return {length: firstNumberLength};
                    }
                    else {
                        // Just a number with a decimal. Keep scanning.
                        firstNumberLength = index;
                        seenDecimal = true;
                        lastWasNumber = false;
                    }
                }
            }
            else if(char === '/'){
                if(!lastWasNumber){
                    // x./ or x// or x / in any set is not good, return first number detected
                    return {length: firstNumberLength};
                }
                else {
                    if(seenSpace){
                        if(seenSlash){
                            // x x/x/ is not valid, just return first thing detected
                            return {length: firstNumberLength};
                        }
                        else {
                            // x x/ means we may be building fraction, continue
                            // Don't set first number length, it's alread set for the one before the space
                            seenSlash = true;
                            lastWasNumber = false;
                        }
                    }
                    else if(seenSlash){
                        if(seenDecimal){
                            // We have /x.x/, so return it as a decimal number
                            return {length: index};
                        }
                        else {
                            if(firstNumberLength > 0){
                                // If we have x/x/, return first number
                                return {length: firstNumberLength};
                            }
                            else {
                                // We have /x/, so just return x
                                return {length: index};
                            }
                        }
                    }
                    else if(seenDecimal) {
                        if(firstNumberLength > 0){
                            // x.x/ return decimal number
                            return {length: index};
                        }
                        else {
                            // .x/ Depnds if there was a hanging decimal for wether we treat it like a whole number or decimal
                            if(hangingDecimal){
                                return {length: index};
                            }
                            else {
                                return {includeStartingDecimal: true, length: index};
                            }
                        }
                    }
                    else {
                        // A number followed by a space. Keep on scanning as we may have a fraction following it.
                        firstNumberLength = index;
                        seenSlash = true;
                        lastWasNumber = false;
                    }
                }
            }
            else if (char >= '0' && char <= '9') { 
                // Efficient because we'll need to check this every time anyways to know when to break,
                // So might as well store it instead of compare twice again when we run into different object
                lastWasNumber = true;
            }
            else {
                // This basically means we've hit a different character, and we'll treat it like the end of the string
                break;
            }
        }
        
        // Logic for hitting the end
        if(lastWasNumber){
            if(seenDecimal && firstNumberLength === 0){
                // ".xe" if it is interpreted as a decimal depends on if there was a hanging decimal
                if(hangingDecimal){
                    return {length: index};
                }
                else {
                    return {includeStartingDecimal: true, length: index};
                }
            }
            else if(seenSpace && !seenDecimal && !seenSlash){
                // x xe  return first num
                return {length: firstNumberLength};
            }
            else {
                // Normal grouping of digits, like x or x.x or x/x etc, so return everything
                return {length: index};
            }
        }
        else {
            return {length: firstNumberLength};
        }

    }

    /**
     * @returns 1 for greater, -1 for less, 0 for same
     */
    static compare(a: string, b: string): number {
        let maxLength = a.length > b.length  ? a.length : b.length; 
        let aOffset = 0;
        let bOffset = 0;
        let nextA;
        let nextB;
        let numberScanDataA;
        let numberScanDataB;
        let doubleDecimalCheck = false;
        let aHangingDecimal = false;
        let bHangingDecimal = false;
        let isANumber = false;
        let isBNumber = false;
        let aValue = 0;
        let bValue = 0;

        for(let index = 0; index < maxLength; index+=1){
            if(index + aOffset >= a.length){
                if(index + bOffset < b.length){
                    return -1;
                }
                else {
                    // SAME
                    return 0;
                }
            }
            if(index + bOffset >= b.length){
                if(index + aOffset < a.length){
                    return 1;
                }
                else {
                    // SAME
                    return 0;
                }
            }

            nextA = a[index + aOffset];
            isANumber = nextA >= '0' && nextA <= '9';

            nextB = b[index + bOffset];
            isBNumber = nextB >= '0' && nextB <= '9';

            // If both are numbers, compare value of numbers and add to the offset accordingly
            if(isANumber && isBNumber){
                numberScanDataA = this.scanNumber(a, index + aOffset, aHangingDecimal);
                if(numberScanDataA.includeStartingDecimal){
                    aValue = this.translateToNumber(a.substring(index + aOffset - 1, index + aOffset + numberScanDataA.length));
                }
                else {
                    aValue = this.translateToNumber(a.substring(index + aOffset, index + aOffset + numberScanDataA.length));
                    aHangingDecimal = numberScanDataA.hangingDecimal ? true : false; // Because it may not exist
                }
                aOffset += numberScanDataA.length-1;

                numberScanDataB = this.scanNumber(b, index + bOffset, bHangingDecimal);
                if(numberScanDataB.includeStartingDecimal){
                    bValue = this.translateToNumber(b.substring(index + bOffset - 1, index + bOffset + numberScanDataB.length));
                }
                else {
                    bValue = this.translateToNumber(b.substring(index + bOffset, index + bOffset + numberScanDataB.length));
                    bHangingDecimal = numberScanDataB.hangingDecimal ? true : false; // Because it may not exist
                }
                bOffset += numberScanDataB.length-1;

                if(aValue === bValue){
                    if(aValue === 0 && numberScanDataA.length !== numberScanDataB.length){
                        // so then numbers like 0 > 00 > 000, often is sorted like this in real world sizes
                        return numberScanDataA.length < numberScanDataB.length ? 1 : -1;
                    }

                    continue;
                }
                else {
                    return aValue > bValue ? 1 : -1;
                }
            }

            // If either are alphapetical/symbols, compare char
            else {
                if(nextA === nextB){
                    // Reset if there was a hanging decimal, or set if there still are decimals
                    if(nextA !== '.'){
                        aHangingDecimal = false;
                        bHangingDecimal = false;
                    }
                    else if (doubleDecimalCheck){
                        aHangingDecimal = true;
                        bHangingDecimal = true;
                    }
                    else {
                        // Without number context, we might just have a bunch of dots with a number following, in such case 
                        doubleDecimalCheck = true;
                    }
                    
                    continue;
                }
                else {
                    return nextA > nextB ? 1 : -1;
                }
            }
        }


        return 0;
    }
}



/*
let toSort = [
    ".4h 2h",
    "4hm 2h",
    "2h 4h",
    "2h 4hm",
    ".2hm 4h",
    "2hhm 4h",
    "2hm 3/4hm",
    "4h 2hm",
    "4hm 2hm",
]
*/

/*
let toSort = [
    "Apple 1.3",
    "Apple 1.4",
    "Apple 1.33",
    "Orange 1.3",
    "Orange 1.3.4",
    "Orange 1.2.40",
    "Orange 2.3.4",
    "Orange 1.3.4e",
    "Orange 1/3",
    "Orange 2 1/3",
    "Orange 1.7",
    "Orange 1.7/2.3",
    "Orange 1.7/3",
    "Orange 1.7-43"
]
*/

/*
let toSort = [
    "1.5.7.9",
    "1.30.7.9",
    "1.5.70",
    "1.5.7.90",
    "1..5",
    "1..39"
]

let result = toSort.sort(fractionalAlphanumComparison);

for(let thing of result){
    console.log(thing);
}
*/

/*
console.log(scanNumber("1234", 0).length);
console.log(scanNumber("12.34", 0).length);
console.log(scanNumber("12/34", 0).length);
console.log(scanNumber("12 34", 0).length);

console.log(scanNumber(".1234", 1).length);
console.log(scanNumber(".12.34", 1).length);
console.log(scanNumber("/1234", 1).length);
console.log(scanNumber("/12/34", 1).length);

console.log(scanNumber("2.3.6", 0).length);
console.log(scanNumber("23.6", 0).length);
console.log(scanNumber("236", 0).length);

console.log(scanNumber("2/3/6", 0).length);
console.log(scanNumber("23/6", 0).length);
console.log(scanNumber("/236", 1).length);

console.log(scanNumber("/12.34", 1).length);
console.log(scanNumber(".12/34", 1).length);
console.log(scanNumber("/12.34/", 1).length);

console.log(scanNumber("1 2.3", 0).length);
console.log(scanNumber("1 2/3", 0).length);
console.log(scanNumber("1 2/3ft", 0).length);
console.log(scanNumber("1 2/3/4", 0).length);
console.log(scanNumber("1 2 ", 0).length);

console.log(scanNumber(".1234", 1).includeStartingDecimal);
console.log(scanNumber(".1234", 1, true).includeStartingDecimal);
console.log(scanNumber(".12/34", 1).includeStartingDecimal);
console.log(scanNumber(".12/34", 1, true).includeStartingDecimal);
console.log(scanNumber(".1234 ", 1).includeStartingDecimal);
console.log(scanNumber(".1234 ", 1, true).includeStartingDecimal);

console.log(scanNumber(".12.34", 1).includeStartingDecimal);
console.log(scanNumber(".12.34", 1).hangingDecimal);

console.log(scanNumber("/1234.", 1).length);
console.log(scanNumber("12 34/", 0).length);
console.log(scanNumber("12.", 0).length);
console.log(scanNumber("12/", 0).length);
console.log(scanNumber("12 ", 0).length);

console.log(scanNumber("/2..", 1).length);
console.log(scanNumber("/2.3.", 1).length);
console.log(scanNumber("/2.3.", 1).hangingDecimal);
console.log(scanNumber("2 .", 0).length);
console.log(scanNumber("12 4.", 0).length);
console.log(scanNumber("12 4/.5", 0).length);
console.log(scanNumber("12 4/5.", 0).length);
console.log(scanNumber("2..", 0).length);
console.log(scanNumber("12.34.", 0).length);
console.log(scanNumber("12/.", 0).length);
console.log(scanNumber("12/34.", 0).length);

console.log(scanNumber("/12./", 1).length);
console.log(scanNumber("/1234/", 1).length);
console.log(scanNumber("2 /", 0).length);
console.log(scanNumber("2 2/3/", 0).length);
console.log(scanNumber("12./", 0).length);
console.log(scanNumber("12.34/", 0).length);
console.log(scanNumber("12//", 0).length);

console.log(scanNumber(".1234 ", 1).length);
console.log(scanNumber("/123. ", 1).length);
console.log(scanNumber("/123.45 ", 1).length);
console.log(scanNumber("/123 ", 1).length);
console.log(scanNumber("1 2/ ", 0).length);
console.log(scanNumber("1 2/34 ", 0).length);
console.log(scanNumber("123.  ", 0).length);
console.log(scanNumber("12.3  ", 0).length);
console.log(scanNumber("123/  ", 0).length);
console.log(scanNumber("12/3  ", 0).length);
*/

/*
console.log(translateToNumber('304'));
console.log(translateToNumber('30.4'));
console.log(translateToNumber('3 3/4'));
console.log(translateToNumber('3/4'));
*/

/*
console.log(scanNumber('2/3', 0));
console.log(scanNumber('2/3.4', 0));
console.log(scanNumber('2.4/3', 0));
console.log(scanNumber('2.4 3', 0));
console.log(scanNumber('2.4.3', 0));
*/