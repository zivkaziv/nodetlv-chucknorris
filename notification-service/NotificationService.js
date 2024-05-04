const amqplib = require("amqplib");

module.exports = class NotificationService {
    constructor(connectionString, queueName) {
        this.connectionString = connectionString
        this.queueName = queueName;
        this.channel = undefined
    }

    async init(){
        const conn = await amqplib.connect(this.connectionString);

        this.channel = await conn.createChannel();
        this.channel.assertQueue(this.queueName);
    }

    async consumeMessages(){
        try {
            await this.channel.consume(this.queueName, (msg) => {
                console.log("Message: ", JSON.parse(msg.content));
                this.channel.ack(msg);
            });

            console.log("Read message from CONSUMER \n");
        } catch (error) {
            console.log(error);
        }
    }
}