import { client } from "../config/redis";
import { exec } from "shelljs";
import fs from "fs";

type bodyType = { name: string; lang: string; id: string; timeout: number };
const OS = process.platform;

const codeRunner = async (body: bodyType) => {
  try {
    client.set(body.id, "running");
    const path = `${process.cwd()}/../temp/${body.id}`;
    exec(`echo "" > ${path}/output.txt`);
    switch (body.lang) {
      case "python":
        runPython(path, body.name);
        break;

      default:
        break;
    }
    fs.readFile(`${path}/output.txt`, (err, data) => {
      const len = data.toString().length;
      if (err || !data || len === 0) {
        console.log("err: " + err);
        client.set(body.id, "{result: 'Compilation Error'}");
      }
      const res = { result: data };
      client.set(body.id, JSON.stringify(res));
    });
    // clear(path);
  } catch (err) {
    console.log("Error! " + err);
  }
};
const runPython = (path: string, fileName: string) => {
  const compiler = OS === "win32" ? "python" : "python3";
  try {
    exec(
      `${compiler} ${path}/${fileName} < ${path}/input.txt > ${path}/output.txt`
    );
  } catch (err) {
    console.log("err " + err);
    console.log("i think u should try aagin");
  }
};

// const clear = (path: string) => {
//   exec(`rm -rf ${path}`);
// };

export default codeRunner;
