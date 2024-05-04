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

    async sendNotification(msg, summaryMetric) {
        const delay = Math.floor(Math.random() * (MAX_SLEEP - MIN_SLEEP + 1)) + MIN_SLEEP;
        const end = summaryMetric.startTimer();
        console.log("Message: ", JSON.parse(msg.content));
        await sleep(delay);
        end();
    }

    async consumeMessages(summaryMetric) {
        try {
            await this.channel.consume(this.queueName, async (msg) => {
                await this.sendNotification(msg, summaryMetric)
                this.channel.ack(msg);
            });
            console.log("Read message from CONSUMER \n");
        } catch (error) {
            console.log(error);
        }
    }
}