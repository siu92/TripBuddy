const nonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export const sumCostGroups = (groups = []) =>
  Math.round(
    groups.reduce(
      (groupTotal, group) =>
        groupTotal +
        (group?.rows || []).reduce(
          (rowTotal, row) => rowTotal + nonNegativeNumber(row?.[1]),
          0,
        ),
      0,
    ),
  );

export const stablePlanEstimate = ({ calculatedTotal, announcedTotal, detailedTotal }) =>
  Math.round(
    Math.max(
      nonNegativeNumber(calculatedTotal),
      nonNegativeNumber(announcedTotal),
      nonNegativeNumber(detailedTotal),
    ),
  );

export const addPriceVariationBuffer = (groups = [], stableTotal = 0) => {
  const detailTotal = sumCostGroups(groups);
  const buffer = Math.max(0, Math.round(nonNegativeNumber(stableTotal) - detailTotal));

  if (buffer < 1) return groups;

  return [
    ...groups,
    {
      group: "현장 변동 여유 · 1인 기준",
      rows: [
        [
          "식비·현장 요금 변동 여유",
          buffer,
          "처음 안내한 예상 경비 안에서 현장 가격 변동에 대비하는 금액",
        ],
      ],
    },
  ];
};
