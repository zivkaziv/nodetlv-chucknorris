const amqplib = require("amqplib");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const MAX_SLEEP = 500
const MIN_SLEEP = 50
module.exports = class NotificationService {
    constructor(connectionString, queueName) {
        this.connectionString = connectionString
        this.queueName = queueName;
        this.channel = undefined
    }

    async init() {
        const conn = await amqplib.connect(this.connectionString);

        this.channel = await conn.createChannel();
        this.channel.assertQueue(this.queueName);
    }

    async sendNotification(msg) {
        const delay = Math.floor(Math.random() * (MAX_SLEEP - MIN_SLEEP + 1)) + MIN_SLEEP;
        console.log("Message: ", msg);
        await sleep(delay);
    }

    async consumeMessages(summaryMetric, handlingTimeMetric) {
        try {
            const metric = summaryMetric
            const handlingMetric = handlingTimeMetric
            await this.channel.consume(this.queueName, async (msg) => {
                const jsonMsg = JSON.parse(msg.content)
                const end = metric.startTimer();
                await this.sendNotification(jsonMsg)
                this.channel.ack(msg);
                if (jsonMsg?.metadata?.requestReceivedTime) {
                    const duration = Date.now() - jsonMsg.metadata.requestReceivedTime;
                    console.log({duration})
                    handlingMetric.observe(duration)
                }
                end();
            });
            console.log("Read message from CONSUMER \n");
        } catch (error) {
            console.log(error);
        }
    }
}