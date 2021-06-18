import { client } from "../config/redis";
import { exec } from "shelljs";
import fs from "fs";
import { ChannelWrapper } from "amqp-connection-manager";
import path from "path";

type bodyType = { name: string; lang: string; id: string; timeout: number };
const OS = process.platform;

const codeRunner = async (
  body: bodyType,
  channelWrapper: ChannelWrapper,
  msg: any
) => {
  try {
    client.set(body.id, "running");
    const location = path.join(process.cwd(), "..", "temp", body.id);
    exec(`echo "" > ${path.join(location, "output.txt")}`);
    switch (body.lang) {
      case "python":
        runPython(location, body.name, body.id);
        break;

      case "java":
        runJava(location, body.name, body.id);
        break;

      case "c++":
        runCpp(location, body.name, body.id);
        break;

      default:
        break;
    }
    fs.readFile(path.join(location, "output.txt"), (err, data) => {
      const len = data.toString().trim().length;
      if (err || !data || len === 0) {
        console.log("err: " + err);
        client.set(body.id, "{result: 'Compilation Error'}");
      }
      const res = { result: data };
      client.set(body.id, JSON.stringify(res));
    });
    clear(location);
    channelWrapper.ack(msg);
  } catch (err) {
    console.log("Error! " + err);
  }
};
const runPython = (location: string, fileName: string, id: string) => {
  const compiler = OS === "win32" ? "python" : "python3";
  try {
    exec(
      `${compiler} ${path.join(location, fileName)} < ${path.join(
        location,
        "input.txt"
      )} > ${path.join(location, "output.txt")}`
    );
  } catch (err) {
    client.set(id, "{result: 'Compilation Error'}");
    console.log("err(python) " + err);
  }
};
const runJava = (location: string, fileName: string, id: string) => {
  const className = fileName.substring(0, fileName.length - 5);
  try {
    exec(
      `javac ${path.join(location, fileName)} && java ${path.join(
        location,
        className
      )} < ${path.join(location, "input.txt")} > ${path.join(
        location,
        "output.txt"
      )}`
    );
  } catch (err) {
    console.log("err(java) " + err);
    client.set(id, "{result: 'Compilation Error'}");
  }
};
const runCpp = (location: string, fileName: string, id: string) => {
  const extension = OS === "win32" ? ".exe" : ".out";
  try {
    exec(
      `g++ -o ${path.join(location, `a${extension}`)} ${path.join(
        location,
        fileName
      )} && ${path.join(location, `a${extension}`)} < ${path.join(
        location,
        "input.txt"
      )} > ${path.join(location, "output.txt")}`
    );
  } catch (err) {
    console.log("err(c++) " + err);
    client.set(id, "{result: 'Compilation Error'}");
  }
};

const clear = (location: string) => {
  exec(`rm -rf ${location}`);
};

export default codeRunner;
