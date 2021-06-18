import express, { Request, Response } from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import routes from "./routes";
import path from "path";
import fs from "fs";
import fileUpload from "express-fileupload";
import { sendToRabbitMQ } from "./config/rabbitmq";
import isValid from "./middleware/isValid";
const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// TODO remove this api
app.use("/api", routes);
app.use("/", express.static(path.join(__dirname, "public")));

app.post("/upload", isValid, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const dirId = uuid();
    const location = path.join(process.cwd(), "temp", dirId);

    const data = {
      // @ts-ignore
      name: req.files!.sourcecode.name,
      lang: req.body.lang,
      id: dirId,
      timeout: 5000,
    };

    fs.mkdir(location, () => console.log("folder created"));
    if (!fs.existsSync(location)) {
      setTimeout(async () => {
        fs.writeFile(
          path.join(location, "input.txt"),
          // @ts-ignore
          req.files!.input.data,
          (err) => {
            if (err) {
              console.log(err);
              return res.json({ done: false, err: "Wrong input file" });
            }
            return console.log("input file created!");
          }
        );
        fs.writeFile(
          // @ts-ignore
          path.join(location, req.files!.sourcecode.name),
          // @ts-ignore
          req.files!.sourcecode.data,
          (err) => {
            if (err) {
              console.log(err);
              return res.json({ done: false, err: "Compilation error" });
            }
            return console.log("Source code file created!");
          }
        );

        await sendToRabbitMQ(data);
      }, 5000);
    } else {
      fs.writeFile(
        path.join(location, "input.txt"),
        // @ts-ignore
        req.files!.input.data,
        (err) => {
          if (err) {
            console.log(err);
            return res.json({ done: false, err: "Wrong input file" });
          }
          return console.log("input file created!");
        }
      );
      fs.writeFile(
        // @ts-ignore
        path.join(location, req.files!.sourcecode.name),
        // @ts-ignore
        req.files!.sourcecode.data,
        (err) => {
          if (err) {
            console.log(err);
            return res.json({ done: false, err: "Compilation error" });
          }
          return console.log("Source code file created!");
        }
      );

      await sendToRabbitMQ(data);
    }
    return res.redirect(`http://localhost:5000/api/results/${data.id}`);
  } catch (err) {
    return res.json({ done: false, err: "Something went wrong" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});
