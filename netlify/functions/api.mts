import type { Config } from "@netlify/functions";
import { handleApi } from "../../server/api";
export default handleApi;
export const config: Config = { path: "/api/*" };
