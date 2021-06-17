import * as amqp from "amqp-connection-manager";
const QUEUE_NAME = "judge";
type msgType = { name: string; lang: string; id: string; timeout: number };

const connection = amqp.connect(["amqp://user1:password@localhost:5672"]);

connection.on("connect", function () {
  console.log("Connected to RabbitMQ!");
});

connection.on("disconnect", function (err) {
  console.log("Disconnected to RabbitMQ", err);
});

const channelWrapper = connection.createChannel({
  json: true,
  setup: function (channel: any) {
    // `channel` here is a regular amqplib `ConfirmChannel`.
    return channel.assertQueue(QUEUE_NAME, {
      durable: false,
      autoDelete: true,
    });
  },
});

export const sendToRabbitMQ = async (data: msgType) => {
  channelWrapper
    .sendToQueue(QUEUE_NAME, data)
    .then(function () {
      console.log("Message sent");
    })
    .catch(function (err) {
      console.log("Message was rejected:", err.stack);
      channelWrapper.close();
      connection.close();
    });
};
