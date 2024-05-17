const amqplib = require("amqplib");

module.exports = class QueuePublisher {
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

    async publish(fact, email, metadata){
        return await this.channel.sendToQueue(
            this.queueName,
            Buffer.from(JSON.stringify({
                fact,
                metadata,
                email
            }))
        );
    }
}