//import wordlist from './wordlist.txt';
import wordlist from './highwordlist.txt';

export const minWordLength = 3;
export const maxWordLength = 30;

export class WordArray {
    constructor(public from:number, public to:number, public letters:string[]) { }
}

export class Dict {

    words:string[] = [];
    wordsByLength:string[][] = [];
    wordsByLetter:Map<string,string[]> = new Map<string,string[]>();

    constructor() {
        this.wordsByLength.length = maxWordLength;

        const lines = wordlist.split("\n");
        for (var i in lines) {
            const line = lines[i];
            const tmp = line.split(";");
            const word = tmp[0].toUpperCase();
            const score = parseInt(tmp[1]);

            if (word.length < minWordLength || word.length > maxWordLength) {
                console.log("Skipping invalid term: ", word);
                continue;
            } else if (score < 50) {
                continue;
            }

            // insert into word lis
            this.words.push(word);

            // insert into list by length
            if (this.wordsByLength[word.length - 1] == undefined) {
                this.wordsByLength[word.length - 1] = [];
            }
            this.wordsByLength[word.length - 1].push(word);

            // insert into list by letter
            const letter = word.charAt(0);
            if (!this.wordsByLetter.has(letter)) {
                this.wordsByLetter.set(letter, []);
            }
            this.wordsByLetter.get(letter).push(word);
       }

        console.log(this.words);
        console.log(this.wordsByLength);
        console.log(this.wordsByLetter);
    }

    matchAll(arr:WordArray) : string[] { 
        var res = [];
        const unconstrained = arr.letters.every(l => l === null);

        // for (var i = minWordLength; i <= arr.letters.length; i++) {
        for (var i = arr.letters.length; i <= arr.letters.length; i++) {
            const words = this.wordsByLength[i - 1];
            if (!words) continue;
            if (unconstrained) {
				res.push(...words);
            } else {
                for (var j in words) {
					if (this.matches(arr.letters, words[j])) {
						res.push(words[j]);
					}
                }
            }
        }
        return res;
    }

    matches(pattern:string[], word:string) : boolean {
        for (var i in pattern) {
            if (pattern[i] !== null && word[i] !== pattern[i]) {
                return false;
            }
        }
        return true;
    }
}