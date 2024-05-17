const express = require("express");
const axios = require("axios");
const client = require("prom-client");

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const register = new client.Registry();
const {auth} = require("./auth");

const FACT_SERVICE_URL = process.env.FACT_SERVICE_URL || "http://localhost:8001"

const summaryApiRequest = new client.Summary({
    name: 'api_request',
    help: 'summary of api_request',
    labelNames: ['method', 'statusCode', 'endPoint'],
});
register.registerMetric(summaryApiRequest);
app.get("/fact", auth, async (req, res) => {
    const startTime = Date.now()
    try {
        const {data} = await axios.get(`${FACT_SERVICE_URL}/fact`);
        res.json(data);
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("GET", "200", "fact").observe(duration)
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("GET", "500", "fact").observe(duration)
    }
});

app.post("/fact", auth, async (req, res) => {
    const startTime = Date.now()
    try {
        const metadata = {
            requestReceivedTime: Date.now()
        }
        const {data} = await axios.post(`${FACT_SERVICE_URL}/fact`, {...req.body, metadata});
        res.json(data);
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("POST", "200", "fact").observe(duration)
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
        const duration = Date.now() - startTime;
        summaryApiRequest.labels("POST", "500", "fact").observe(duration)
    }
});
app.get("/metrics", (req, res) => {
    res.setHeader('Content-Type', register.contentType)
    res.end(register.metrics())
})
const initMetrics = () => {
    const app = process.env.APP_NAME || 'api-gateway'
    register.setDefaultLabels({app})
    client.collectDefaultMetrics({register})
}

app.init = async () => {
    initMetrics();
}

module.exports = app;
