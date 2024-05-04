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
    const end = summaryApiRequest.startTimer();
    try {
        const {data} = await axios.get(`${FACT_SERVICE_URL}/fact`);
        res.json(data);
        end({method:"GET", statusCode:"200", endPoint: "fact"})
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
        end({method:"GET", statusCode:"500", endPoint: "fact"})
    }
});

app.post("/fact", auth, async (req, res) => {
    const end = summaryApiRequest.startTimer();
    try {
        const {data} = await axios.post(`${FACT_SERVICE_URL}/fact`, req.body);
        res.json(data);
        end({method:"GET", statusCode:"200", endPoint: "fact"})
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
        end({method:"GET", statusCode:"500", endPoint: "fact"})
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
