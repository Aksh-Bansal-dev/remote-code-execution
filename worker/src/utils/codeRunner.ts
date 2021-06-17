import { client } from "../config/redis";
import { exec } from "shelljs";
import fs from "fs";
import { ChannelWrapper } from "amqp-connection-manager";

type bodyType = { name: string; lang: string; id: string; timeout: number };
const OS = process.platform;

const codeRunner = async (
  body: bodyType,
  channelWrapper: ChannelWrapper,
  msg: any
) => {
  try {
    client.set(body.id, "running");
    const path = `${process.cwd()}/../temp/${body.id}`;
    exec(`echo "" > ${path}/output.txt`);
    switch (body.lang) {
      case "python":
        runPython(path, body.name, body.id);
        break;

      case "java":
        runJava(path, body.name, body.id);
        break;

      case "c++":
        runCpp(path, body.name, body.id);
        break;

      default:
        break;
    }
    fs.readFile(`${path}/output.txt`, (err, data) => {
      const len = data.toString().trim().length;
      if (err || !data || len === 0) {
        console.log("err: " + err);
        client.set(body.id, "{result: 'Compilation Error'}");
      }
      const res = { result: data };
      client.set(body.id, JSON.stringify(res));
    });
    clear(path);
    channelWrapper.ack(msg);
  } catch (err) {
    console.log("Error! " + err);
  }
};
const runPython = (path: string, fileName: string, id: string) => {
  const compiler = OS === "win32" ? "python" : "python3";
  try {
    exec(
      `${compiler} ${path}/${fileName} < ${path}/input.txt > ${path}/output.txt`
    );
  } catch (err) {
    client.set(id, "{result: 'Compilation Error'}");
    console.log("err " + err);
  }
};
const runJava = (path: string, fileName: string, id: string) => {
  const className = fileName.substring(0, fileName.length - 5);
  try {
    exec(
      `javac ${path}/${fileName} && java ${className} < ${path}/input.txt > ${path}/output.txt`
    );
  } catch (err) {
    console.log("err " + err);
    client.set(id, "{result: 'Compilation Error'}");
  }
};
const runCpp = (path: string, fileName: string, id: string) => {
  const extension = OS === "win32" ? ".exe" : ".out";
  try {
    exec(
      `g++ -o ${path}/a${extension} ${path}/${fileName} && ${path}/a${extension} < ${path}/input.txt > ${path}/output.txt`
    );
  } catch (err) {
    console.log("err " + err);
    client.set(id, "{result: 'Compilation Error'}");
  }
};

const clear = (path: string) => {
  exec(`rm -rf ${path}`);
};

export default codeRunner;
