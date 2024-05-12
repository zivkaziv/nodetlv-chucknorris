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
    const end = summaryApiRequest.startTimer();
    try {
        const fact = await factService.getRandomFact();
        res.json(fact);
        end({method:"GET", statusCode:"200", endPoint: "fact"})
    } catch (err) {
        res.status(500).json({error: 'failed to get your fact'});
        end({method:"GET", statusCode:"200", endPoint: "fact"})
    }
});

app.post("/fact", async (req, res) => {
    const end = summaryApiRequest.startTimer();
    try {
        const email = req.body.email;
        const isValidEmail = validator.validate(email);
        if (!isValidEmail) {
            return res.status(400).json({error: `email ${email} is not valid`})
        }
        const fact = await factService.getRandomFact();
        const is_published = await queuePublisher.publish(fact, email)
        res.json({
            status: "success",
            data: {
                fact,
                email,
                is_published
            }
        });
        end({method:"GET", statusCode:"200", endPoint: "fact"})
    } catch (err) {
        res.status(500).json({error: 'failed to send your fact'});
        end({method:"GET", statusCode:"200", endPoint: "fact"})
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
