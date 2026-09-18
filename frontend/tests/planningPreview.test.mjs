import test from "node:test";
import assert from "node:assert/strict";
import { buildPlanningPreview } from "../src/utils/planningPreview.js";

test("panorama rejects duplicate photos even with different resizing parameters", () => {
  const result = buildPlanningPreview([
    { name: "해변 A", image: "https://images.example/photo.jpg?w=400" },
    { name: "해변 B", image: "https://images.example/photo.jpg?w=900" },
    { name: "해변 A", image: "https://images.example/other.jpg" },
    { name: "사진 없음" },
  ]);
  assert.equal(result.length, 1);
});

test("attractions, restaurants and stays interleave without repeating or losing unique images", () => {
  const input = [
    { name: "해변", image: "/a.jpg" }, { name: "오름", image: "/b.jpg" },
    { name: "식당", image: "/c.jpg", representativeMenu: "점심" },
    { name: "숙소", image: "/d.jpg", category: "숙소" },
  ];
  const output = buildPlanningPreview(input);
  assert.deepEqual(output.map(p => p.category), ["관광지", "음식점", "숙소", "관광지"]);
  assert.equal(new Set(output.map(p => p.imageKey)).size, 4);
  assert.equal(input[0].category, undefined);
});
