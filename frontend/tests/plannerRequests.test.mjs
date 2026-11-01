import test from "node:test";
import assert from "node:assert/strict";
import { createLatestRequest } from "../src/planner/latestRequest.js";

test("늦은 이전 성공 응답이 최신 검색 결과를 덮어쓰지 않는다", async () => {
  const requests = createLatestRequest();
  let finishOld;
  let displayed;
  const isOldCurrent = requests.begin();
  const old = new Promise((resolve) => {
    finishOld = resolve;
  }).then((value) => {
    if (isOldCurrent()) displayed = value;
  });
  const isNewCurrent = requests.begin();
  if (isNewCurrent()) displayed = "new";
  finishOld("old");
  await old;
  assert.equal(displayed, "new");
});

test("이전 실패·finally가 최신 오류와 로딩 상태를 변경하지 않는다", async () => {
  const requests = createLatestRequest();
  const isOldCurrent = requests.begin();
  const isNewCurrent = requests.begin();
  let error = "";
  let loading = true;
  try {
    await Promise.reject(new Error("old failure"));
  } catch (failure) {
    if (isOldCurrent()) error = failure.message;
  } finally {
    if (isOldCurrent()) loading = false;
  }
  assert.equal(error, "");
  assert.equal(loading, true);
  assert.equal(isNewCurrent(), true);
});

test("입력 초기화·조건 변경·언마운트로 진행 중 요청을 무효화할 수 있다", () => {
  const requests = createLatestRequest();
  const current = requests.begin();
  requests.invalidate();
  assert.equal(current(), false);
  assert.equal(requests.begin()(), true);
});
