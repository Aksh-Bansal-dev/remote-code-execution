import { Request, Response, NextFunction } from "express";

const langMap: Map<String, String> = new Map();
langMap.set("python", ".py");
langMap.set("java", ".java");
langMap.set("c++", ".cpp");

const isValid = (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const inputFileName: string = req.files.input.name;
    if (
      !req.files ||
      inputFileName.length <= 4 ||
      inputFileName.substring(inputFileName.length - 4) !== ".txt"
    ) {
      res.json({ done: false, err: "Wrong input file" });
      return;
    }

    const ext = langMap.get(req.body.lang);
    // @ts-ignore
    const codeName = req.files!.sourcecode.name;
    if (
      !codeName ||
      !ext ||
      codeName.length <= ext.length ||
      codeName.substring(codeName.length - ext.length) !== ext
    ) {
      res.json({ done: false, err: "Wrong language" });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    res.json({ done: false, err: "invalid files" });
    return;
  }
};
export default isValid;
