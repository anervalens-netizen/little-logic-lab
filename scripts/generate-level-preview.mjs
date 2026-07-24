import fs from "node:fs";
import path from "node:path";
import {
  generateGentleMaze,
  generateGoNoGo,
  generateMemorySequence,
  generateNumberChoice,
  generateOrderLevel,
  generatePattern,
  generateSortLevel,
  generateVisualChoice,
} from "../packages/core/dist/index.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const itemsDoc = JSON.parse(fs.readFileSync(path.join(root, "content", "themes", "sample-items.json"), "utf8"));
const items = itemsDoc.items.map((item) => ({ id: item.id, attributes: item.attributes }));
const symbols = items.slice(0, 6).map((item) => item.id);

const levels = [
  generateVisualChoice("preview:visual", {
    gameId: "same-picture",
    items,
    choiceCount: 3,
    similarityAttribute: "category",
  }),
  generateSortLevel("preview:sort", {
    gameId: "sort-by-color",
    items,
    attribute: "color",
    binCount: 2,
    itemCount: 6,
  }),
  generateMemorySequence("preview:sequence", {
    gameId: "sequence-lights",
    symbols,
    sequenceLength: 3,
  }),
  generateGoNoGo("preview:gng", {
    gameId: "tap-dont-tap",
    trialCount: 8,
    goRatio: 0.65,
    goStimulusId: "sun-yellow",
    noGoStimulusId: "cloud-blue",
  }),
  generatePattern("preview:pattern", {
    gameId: "repeat-pattern-ab",
    symbols,
    family: "AAB",
    totalLength: 7,
  }),
  generateNumberChoice("preview:number", {
    gameId: "quantity-match",
    maxQuantity: 5,
    choiceCount: 3,
  }),
  generateOrderLevel("preview:order", {
    gameId: "daily-order",
    orderedStepIds: ["wash-hands", "sit-at-table", "eat"],
  }),
  generateGentleMaze("preview:maze", {
    gameId: "simple-maze",
    gridSize: 4,
  }),
];

const outputPath = path.join(root, "examples", "generated-levels.json");
fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: "deterministic-preview", levels }, null, 2)}\n`, "utf8");
console.log(`Wrote ${levels.length} deterministic sample levels to examples/generated-levels.json.`);
