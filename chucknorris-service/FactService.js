const Fact = require("./Fact");
const csv = require("csvtojson");

module.exports = class FactService {
    constructor() {
        this.facts = [];
    }

    async initFacts(csvFilePath = "chuck_facts.csv") {
        this.facts = await csv().fromFile(csvFilePath).then(rows => {
            return rows.map(fact => new Fact(fact));
        });
    }

    async getRandomFact() {
        await this.initFacts()
        return this.facts[Math.floor(Math.random() * this.facts.length)];
    }
}