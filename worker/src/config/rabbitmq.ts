import * as amqp from "amqp-connection-manager";
import codeRunner from "../utils/codeRunner";

const QUEUE_NAME = "judge";
const connection = amqp.connect(["amqp://user1:password@localhost:5672"]);

connection.on("connect", function () {
  console.log("Connected!");
});

connection.on("disconnect", function (err) {
  console.log("Disconnected.", err);
});

const onMessage = (data: any) => {
  let message = JSON.parse(data.content.toString());
  console.log(message);
  codeRunner(message, channelWrapper, data);
};

// Set up a channel listening for messages in the queue.
const channelWrapper = connection.createChannel({
  setup: function (channel: any) {
    // `channel` here is a regular amqplib `ConfirmChannel`.
    return Promise.all([
      channel.assertQueue(QUEUE_NAME, { durable: false, autoDelete: true }),
      channel.prefetch(1),
      channel.consume(QUEUE_NAME, onMessage),
    ]);
  },
});

channelWrapper.waitForConnect().then(function () {
  console.log("Listening for messages");
});
