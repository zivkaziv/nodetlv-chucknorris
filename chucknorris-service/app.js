const express = require("express");
const client = require("prom-client");
const JokeService = require("./JokeService")

const app = express();
const register = new client.Registry()
const jokeService = new JokeService()

app.get("/joke", async (req, res) => {
    try {
        const joke = jokeService.getRandomJoke();
        res.json(joke);
    } catch (err) {
        res.status(500).json({error: 'failed to get your joke'});
    }
});
app.get("/metrics", async (req, res) => {
    res.setHeader('Content-Type', register.contentType)
    res.end(register.metrics())
})
const initMetrics = () => {
    const app = process.env.APP_NAME || 'chucknorris-service'
    register.setDefaultLabels({ app })
    client.collectDefaultMetrics({register})
}

app.init = async () => {
    await jokeService.initJokes();
    initMetrics();
}

module.exports = app;
