
const maxLength = 30;

export class Dict {

    words:string[] = [];
    wordsByLength:string[][] = [];
    wordsByLetter:Map<string,string[]> = new Map<string,string[]>();

    constructor(wordlist:string) {
        this.wordsByLength.length = maxLength;

        const lines = wordlist.split("\n");
        for (var i in lines) {
            const line = lines[i];
            const tmp = line.split(";");
            const word = tmp[0].toUpperCase();

            if (word.length < 1 || word.length > maxLength) {
                console.log("Skipping invalid term: ", word);
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
}