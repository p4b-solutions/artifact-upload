import * as core from "@actions/core";
import fs from "node:fs";
import path from "node:path";
import * as tar from "tar";
import axios, { isAxiosError } from "axios";
import FormData from "form-data";

async function run(): Promise<void> {
  try {
    const name = core.getInput("name");
    const workflow_id = core.getInput("workflow_id");
    const url = core.getInput("url"); // "https://files.p4b.biz/v3/upload/artifacts"
    const src = core.getInput("path");
    const cwd = fs.statSync(src).isDirectory() ? src : path.dirname(src);
    const files = src === cwd ? ["."] : [path.basename(src)];
    await tar.create({ gzip: true, file: `${name}.tgz`, cwd }, files);
    const form = new FormData();
    form.append("file", fs.createReadStream(`${name}.tgz`));
    try {
      await axios.post(`${url}/${workflow_id}/${name}.tgz`, form);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        console.log(`Request error:`, error.response?.data);
        throw new Error(`HTTP error ${error.response.status}: ${error.response.statusText}`);
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
