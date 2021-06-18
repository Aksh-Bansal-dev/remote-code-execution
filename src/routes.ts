import express, { Request, Response } from "express";
import { client } from "./config/redis";

const router = express.Router();

export const getFromRedis = (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    client.get(key, (err: Error | null, data: string | null) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

router.get("/results/:id", async (req: Request, res: Response) => {
  try {
    const key = req.params.id;
    const status = await getFromRedis(key);
    if (status === undefined || status === null) {
      res.status(202).send({ status: "Queued" });
    } else if (status === "running") {
      res.status(202).send({ status: "Running" });
    } else {
      const result = JSON.parse(status);
      const output = Buffer.from(result.result.data).toString();
      let outputString = "";
      for (let i = 0; i < output.length; ++i) {
        if (output.charAt(i) == "\n") {
          outputString += "<br/>";
        } else {
          outputString += output.charAt(i);
        }
      }
      if (result.result.data.length === 0 || output.trim().length === 0) {
        res.send("Compilation Error");
        return;
      }

      res.status(200).send("Result: <br/>" + outputString);
    }
  } catch (err) {
    console.log("Error: " + err);
    res.json({ done: false, err });
  }
});

export default router;
