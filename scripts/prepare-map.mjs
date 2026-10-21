import fs from "node:fs";
import { feature } from "topojson-client";
const topology = JSON.parse(
  fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"),
);
const geo = feature(topology, topology.objects.countries);
const ids = [
  "360",
  "458",
  "096",
  "598",
  "036",
  "626",
  "608",
  "702",
  "764",
  "104",
  "116",
  "704",
];
geo.features = geo.features.filter((f) => ids.includes(String(f.id)));
fs.writeFileSync(
  "public/data/archipelago.geojson",
  JSON.stringify(geo, (_key, v) =>
    typeof v === "number" ? Math.round(v * 1000) / 1000 : v,
  ),
);
console.log(
  "Peta dasar Natural Earth lokal siap:",
  fs.statSync("public/data/archipelago.geojson").size,
  "bytes",
);
