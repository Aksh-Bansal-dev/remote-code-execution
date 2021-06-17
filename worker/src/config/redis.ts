import redis from "redis";

export const client = redis.createClient({
  host: "localhost",
  port: 6379,
});

client.on("error", (err) => {
  console.log("Error " + err);
});
