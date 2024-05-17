const express = require("express");
const client = require("prom-client");
const validator = require("email-validator");
const FactService = require("./FactService")
const QueuePublisher = require("./QueuePublisher")

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const register = new client.Registry();
const factService = new FactService();
let queuePublisher = undefined;

const summaryApiRequest = new client.Summary({
    name: 'api_request',
    help: 'summary of api_request',
    labelNames: ['method', 'statusCode', 'endPoint'],
});
register.registerMetric(summaryApiRequest);
app.get("/fact", async (req, res) => {
    const startTime = Date.now()
    try {
        const fact = await factService.getRandomFact();
        res.json(fact);
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("GET", "200", "fact").observe(duration)
    } catch (err) {
        res.status(500).json({error: 'failed to get your fact'});
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("GET", "500", "fact").observe(duration)
    }
});

app.post("/fact", async (req, res) => {
    const startTime = Date.now()
    try {
        const {email, metadata} = req.body;
        const isValidEmail = validator.validate(email);
        if (!isValidEmail) {
            return res.status(400).json({error: `email ${email} is not valid`})
        }
        const fact = await factService.getRandomFact();
        const is_published = await queuePublisher.publish(fact, email, metadata)
        res.json({
            status: "success",
            data: {
                fact,
                email,
                is_published
            }
        });
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("POST", "200", "fact").observe(duration)
    } catch (err) {
        res.status(500).json({error: 'failed to send your fact'});
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("POST", "500", "fact").observe(duration)
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
    // await factService.initFacts();
    await initQueuePublisher()
    initMetrics();
}


module.exports = app;
