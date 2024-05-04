const Joke = require("./Joke");
const csv = require("csvtojson");

module.exports = class JokeService {
    constructor() {
        this.jokes = [];
    }

    async initJokes(csvFilePath = "chuck_jokes.csv") {
        this.jokes = await csv().fromFile(csvFilePath).then(rows => {
            return rows.map(joke => new Joke(joke));
        });
    }

    getRandomJoke() {
        return this.jokes[Math.floor(Math.random() * this.jokes.length)];
    }
}