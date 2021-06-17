import express from "express";
import cors from "cors";
import "./config/rabbitmq";
import "./config/redis";
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});
