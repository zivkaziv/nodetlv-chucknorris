const express = require("express");
const axios = require("axios");
const client = require("prom-client");

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const register = new client.Registry();
const {auth} = require("./auth");

const FACE_SERVICE_URL = process.env.FACT_SERVICE_URL || "http://localhost:8001"
app.get("/fact", auth, async (req, res) => {
    try {
        const {data} = await axios.get(`${FACT_SERVICE_URL}/fact`);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
    }

});

app.post("/fact", auth, async (req, res) => {
    try {
        const {data} = await axios.post(`${FACT_SERVICE_URL}/fact`, req.body);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'failed to get your fact'});
    }
});
app.get("/metrics", async (req, res) => {
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
