const express = require("express");
const client = require("prom-client");

const app = express();
const register = new client.Registry()
const NotificationService = require('./NotificationService');

app.get("/metrics", async (req, res) => {
    res.setHeader('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.end(metrics)
})
const initMetrics = () => {
    const app = process.env.APP_NAME || 'notification-service'
    register.setDefaultLabels({ app })
    client.collectDefaultMetrics({register})
}

const initNotificationService = async () => {
    const connectionString = process.env.RABBIT_CONNECTION_STRING || "amqp://user:password@localhost:5672"
    const notificationServiceQueueName = process.env.QUEUE_NAME ||  "notifications"
    console.log({
        connectionString,
        notificationServiceQueueName
    })
    const notificationService = new NotificationService(connectionString, notificationServiceQueueName)
    await notificationService.init()
    await notificationService.consumeMessages()
}

app.init = async () => {
    initMetrics();
    await initNotificationService();
}

module.exports = app;
