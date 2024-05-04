const express = require("express");
const client = require("prom-client");
const validator = require("email-validator");
const JokeService = require("./JokeService")
const QueuePublisher = require("./QueuePublisher")

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const register = new client.Registry();
const jokeService = new JokeService();
let queuePublisher = undefined;
app.get("/joke", async (req, res) => {
    try {
        const joke = jokeService.getRandomJoke();
        res.json(joke);
    } catch (err) {
        res.status(500).json({error: 'failed to get your joke'});
    }
});

app.post("/joke", async (req, res) => {
    try {
        const email = req.body.email;
        const isValidEmail = validator.validate(email);
        if (!isValidEmail) {
            return res.status(400).json({error: `email ${email} is not valid`})
        }
        const joke = jokeService.getRandomJoke();
        const is_published = await queuePublisher.publish(joke, email)
        res.json({
            status: "success",
            data: {
                joke,
                email,
                is_published
            }
        });
    } catch (err) {
        res.status(500).json({error: 'failed to send your joke'});
    }
});
app.get("/metrics", (req, res) => {
    res.setHeader('Content-Type', register.contentType)
    res.end(register.metrics())
})
const initMetrics = () => {
    const app = process.env.APP_NAME || 'chucknorris-service'
    register.setDefaultLabels({app})
    client.collectDefaultMetrics({register})
}

const initQueuePublisher = async () => {
    const connectionString = process.env.RABBIT_CONNECTION_STRING || "amqp://user:password@localhost:5672"
    const notificationServiceQueueName = process.env.QUEUE_NAME || "notifications"
    queuePublisher = new QueuePublisher(connectionString, notificationServiceQueueName)
    await queuePublisher.init()
}

app.init = async () => {
    await jokeService.initJokes();
    await initQueuePublisher()
    initMetrics();
}


module.exports = app;
