import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";

import { getCalendarWeather } from "../api/weatherApi";
import { getAccessToken } from "../api/apiClient";

import "./trip-date-picker.css";


const WEEKDAYS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];


const HOUR_OPTIONS = Array.from(
  { length: 25 },
  (_, hour) =>
    String(hour).padStart(2, "0"),
);


const MINUTE_OPTIONS = [
  "00",
  "30",
];


/*
 * 백엔드 WeatherCondition
 *
 * SUNNY
 * CLOUDY
 * RAIN
 * SNOW
 * UNKNOWN
 *
 * ↓
 *
 * 화면 표시용 데이터
 */
const WEATHER_DISPLAY = {
  SUNNY: {
    condition: "맑음",
    icon: "☀️",
  },

  CLOUDY: {
    condition: "흐림",
    icon: "☁️",
  },

  RAIN: {
    condition: "비",
    icon: "🌧️",
  },

  SNOW: {
    condition: "눈",
    icon: "🌨️",
  },

  UNKNOWN: {
    condition: "날씨 정보 없음",
    icon: "🌥️",
  },
};


/*
 * Date → yyyy-MM-dd
 */
const toIso = (date) =>
  `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;


/*
 * yyyy-MM-dd → Date
 */
const fromIso = (value) => {
  const [
    year,
    month,
    day,
  ] = String(value || "")
    .split("-")
    .map(Number);

  return year && month && day
    ? new Date(
        year,
        month - 1,
        day,
      )
    : null;
};


const monthStart = (date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );


const addMonths = (
  date,
  amount,
) =>
  new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );


const formatDate = (value) =>
  value
    ? `${Number(
        value.slice(5, 7),
      )}월 ${Number(
        value.slice(8, 10),
      )}일`
    : "날짜 선택";


/*
 * 백엔드 날씨 데이터를
 * 달력 표시 형식으로 변환
 */
const normalizeWeather = (item) => {
  const display =
    WEATHER_DISPLAY[item.condition] ??
    WEATHER_DISPLAY.UNKNOWN;

  return {
    date: item.date,

    /*
     * 원본 Enum
     */
    weatherCondition: item.condition,

    /*
     * 화면 표시
     */
    condition: display.condition,
    icon: display.icon,
  };
};


const createMonthCells = (
  month,
) => {
  const first =
    monthStart(month);

  const lastDay =
    new Date(
      first.getFullYear(),
      first.getMonth() + 1,
      0,
    ).getDate();

  return [
    ...Array.from(
      {
        length: first.getDay(),
      },
      () => null,
    ),

    ...Array.from(
      {
        length: lastDay,
      },
      (_, index) =>
        new Date(
          first.getFullYear(),
          first.getMonth(),
          index + 1,
        ),
    ),
  ];
};


function CalendarMonth({
  month,
  minDate,
  maxDate,
  start,
  end,
  weatherByDate,
  dragState,
  onDateClick,
  onDateEnter,
  onDatePointerDown,
}) {
  const cells =
    createMonthCells(month);

  return (
    <section
      className="trip-calendar-month"
      aria-label={`${month.getFullYear()}년 ${
        month.getMonth() + 1
      }월`}
    >
      <h3>
        {month.getFullYear()}년{" "}
        {month.getMonth() + 1}월
      </h3>

      <div className="trip-calendar-weekdays">
        {WEEKDAYS.map(
          (day) => (
            <span key={day}>
              {day}
            </span>
          ),
        )}
      </div>

      <div className="trip-calendar-days">
        {cells.map(
          (
            date,
            index,
          ) => {
            if (!date) {
              return (
                <span
                  className="trip-calendar-empty"
                  key={`empty-${index}`}
                />
              );
            }

            const iso =
              toIso(date);

            const disabled =
              iso < minDate ||
              iso > maxDate;

            const isStart =
              iso === start;

            const isEnd =
              iso === end;

            const inRange =
              Boolean(
                start &&
                end &&
                iso > start &&
                iso < end,
              );

            /*
             * 실제 백엔드에서 받아온
             * 해당 날짜 날씨
             */
            const weather =
              weatherByDate.get(
                iso,
              );

            return (
              <button
                type="button"
                key={iso}
                className={
                  `trip-calendar-day` +
                  `${
                    disabled
                      ? " is-disabled"
                      : ""
                  }` +
                  `${
                    inRange
                      ? " is-in-range"
                      : ""
                  }` +
                  `${
                    isStart
                      ? " is-start"
                      : ""
                  }` +
                  `${
                    isEnd
                      ? " is-end"
                      : ""
                  }`
                }
                disabled={
                  disabled
                }
                aria-label={
                  `${month.getFullYear()}년 ${
                    month.getMonth() +
                    1
                  }월 ${
                    date.getDate()
                  }일` +
                  `${
                    weather
                      ? `, ${weather.condition}`
                      : ""
                  }`
                }
                aria-pressed={
                  isStart ||
                  isEnd ||
                  inRange
                }
                onClick={() =>
                  onDateClick(
                    iso,
                  )
                }
                onPointerDown={() =>
                  onDatePointerDown(
                    iso,
                  )
                }
                onPointerEnter={() =>
                  dragState.current &&
                  onDateEnter(
                    iso,
                  )
                }
              >
                <span className="trip-calendar-day-number">
                  {date.getDate()}
                </span>

                {weather ? (
                  <span className="trip-calendar-weather">
                    <i
                      aria-hidden="true"
                      title={
                        weather.weatherCondition
                      }
                    >
                      {weather.icon}
                    </i>

                    <small>
                      {
                        weather.condition
                      }
                    </small>
                  </span>
                ) : null}
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}


function TimeSelect({
  label,
  value,
  onChange,
}) {
  const [
    hour = "00",
    minute = "00",
  ] = String(
    value || "00:00",
  ).split(":");


  const setHour = (
    nextHour,
  ) =>
    onChange(
      `${nextHour}:${
        nextHour === "24"
          ? "00"
          : minute
      }`,
    );


  const setMinute = (
    nextMinute,
  ) =>
    onChange(
      `${hour}:${
        hour === "24"
          ? "00"
          : nextMinute
      }`,
    );


  return (
    <label className="trip-time-select">
      <span>
        <Clock3
          size={15}
        />{" "}
        {label}
      </span>

      <span className="trip-time-select-controls">
        <select
          value={hour}
          onChange={(
            event,
          ) =>
            setHour(
              event.target
                .value,
            )
          }
          aria-label={`${label} 시 선택`}
        >
          {HOUR_OPTIONS.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}시
              </option>
            ),
          )}
        </select>

        <select
          value={
            hour === "24"
              ? "00"
              : minute
          }
          onChange={(
            event,
          ) =>
            setMinute(
              event.target
                .value,
            )
          }
          disabled={
            hour === "24"
          }
          aria-label={`${label} 분 선택`}
        >
          {MINUTE_OPTIONS.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}분
              </option>
            ),
          )}
        </select>
      </span>
    </label>
  );
}


export default function TripDatePicker({
  startDate,
  endDate,
  startTime,
  endTime,
  travelers,

  /*
   * 선택된 도착지
   *
   * {
   *   region: "제주특별자치도",
   *   detail: "제주시",
   *   latitude: 33.4996,
   *   longitude: 126.5312,
   *   apiSearchKeyword: "제주특별자치도 제주시"
   * }
   */
  destinationLocation,

  departureTimeOptions,
  returnTimeOptions,

  onConfirm,

  showTimeFields = false,
}) {
  const today =
    useMemo(
      () =>
        toIso(
          new Date(),
        ),
      [],
    );


  const minMonth =
    useMemo(
      () =>
        monthStart(
          new Date(),
        ),
      [],
    );


  const maxDate =
    useMemo(
      () => {
        const now =
          new Date();

        return toIso(
          new Date(
            now.getFullYear() +
              1,
            now.getMonth(),
            now.getDate(),
          ),
        );
      },
      [],
    );


  const maxMonth =
    useMemo(
      () =>
        monthStart(
          fromIso(
            maxDate,
          ),
        ),
      [maxDate],
    );


  const selectableYears =
    useMemo(
      () =>
        Array.from(
          {
            length:
              maxMonth.getFullYear() -
              minMonth.getFullYear() +
              1,
          },
          (
            _,
            index,
          ) =>
            minMonth.getFullYear() +
            index,
        ),
      [
        maxMonth,
        minMonth,
      ],
    );


  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    cursorMonth,
    setCursorMonth,
  ] =
    useState(() =>
      monthStart(
        fromIso(
          startDate,
        ) ||
          new Date(),
      ),
    );


  const selectableMonths =
    useMemo(
      () =>
        Array.from(
          {
            length: 12,
          },
          (
            _,
            month,
          ) => month,
        ).filter(
          (month) => {
            const candidate =
              new Date(
                cursorMonth.getFullYear(),
                month,
                1,
              );

            return (
              candidate >=
                minMonth &&
              candidate <=
                maxMonth
            );
          },
        ),
      [
        cursorMonth,
        maxMonth,
        minMonth,
      ],
    );


  const [
    draftStart,
    setDraftStart,
  ] =
    useState(
      startDate ||
        today,
    );


  const [
    draftEnd,
    setDraftEnd,
  ] =
    useState(
      endDate ||
        "",
    );


  const [
    draftStartTime,
    setDraftStartTime,
  ] =
    useState(
      startTime ||
        "09:00",
    );


  const [
    draftEndTime,
    setDraftEndTime,
  ] =
    useState(
      endTime ||
        "18:00",
    );


  /*
   * 실제 캘린더 API 결과
   */
  const [
    weatherForecast,
    setWeatherForecast,
  ] =
    useState([]);

  const [
    weatherNotice,
    setWeatherNotice,
  ] = useState("");


  const dragState =
    useRef(null);

  const dragged =
    useRef(false);


  /*
   * [
   *   {
   *     date: "2026-09-10",
   *     condition: "맑음",
   *     icon: "☀️"
   *   }
   * ]
   *
   * ↓
   *
   * Map(
   *   "2026-09-10" => {...}
   * )
   */
  const weatherByDate =
    useMemo(
      () =>
        new Map(
          weatherForecast.map(
            (item) => [
              item.date,
              item,
            ],
          ),
        ),
      [
        weatherForecast,
      ],
    );


  /*
   * 캘린더가 열릴 때
   * 백엔드 날씨 API 호출
   */
  useEffect(
    () => {
      if (!open && !getAccessToken()) {
        return undefined;
      }


      /*
       * 중기예보 지역코드 판단 때문에
       * "애월읍"만 보내면 안 되고
       *
       * "제주특별자치도 제주시 애월읍..."
       *
       * 형태를 우선 사용한다.
       */
      const destination =
        destinationLocation
          ?.apiSearchKeyword ||
        [
          destinationLocation
            ?.region,

          destinationLocation
            ?.detail,
        ]
          .filter(
            Boolean,
          )
          .join(" ");


      const latitude =
        Number(
          destinationLocation
            ?.latitude,
        );


      const longitude =
        Number(
          destinationLocation
            ?.longitude,
        );


      /*
       * 도착지나 좌표가 없으면
       * 날씨 API 호출 안 함
       */
      if (
        !destination ||
        !Number.isFinite(
          latitude,
        ) ||
        !Number.isFinite(
          longitude,
        )
      ) {
        setWeatherForecast(
          [],
        );

        setWeatherNotice(
          "도착지를 선택하면 해당 지역의 날씨를 함께 보여드려요.",
        );

        return undefined;
      }


      const controller =
        new AbortController();


      let active = true;

      setWeatherForecast([]);
      setWeatherNotice("날씨를 불러오고 있어요.");


      const loadWeather =
        async () => {
          try {
            const response =
              await getCalendarWeather(
                {
                  destination,
                  latitude,
                  longitude,

                  signal:
                    controller.signal,
                },
              );


            if (!active) {
              return;
            }


            const weather =
              Array.isArray(
                response,
              )
                ? response.map(
                    normalizeWeather,
                  )
                : [];


            setWeatherForecast(
              weather,
            );

            setWeatherNotice(
              weather.length > 0
                ? ""
                : "현재 확인 가능한 예보가 없습니다.",
            );


            /*
             * 개발자도구에서
             * 실제 API 결과 확인
             */
            if (
              import.meta.env
                .DEV
            ) {
              console.log(
                "[CALENDAR WEATHER] request:",
                {
                  destination,
                  latitude,
                  longitude,
                },
              );

              console.log(
                "[CALENDAR WEATHER] response:",
                response,
              );

              console.log(
                "[CALENDAR WEATHER] normalized:",
                weather,
              );
            }
          } catch (
            error
          ) {
            /*
             * 컴포넌트 정리 과정의
             * Abort는 오류로 취급하지 않는다.
             */
            if (
              !active ||
              error?.code ===
                "REQUEST_ABORTED"
            ) {
              return;
            }


            setWeatherForecast(
              [],
            );

            setWeatherNotice(
              error?.status === 401
                ? "로그인하면 선택한 지역의 날씨를 확인할 수 있어요."
                : "날씨 연결이 잠시 지연되고 있어요. 날짜 선택은 그대로 진행할 수 있습니다.",
            );


            console.error(
              "[CALENDAR WEATHER] API 호출 실패:",
              error,
            );
          }
        };


      loadWeather();


      return () => {
        active = false;

        controller.abort();
      };
    },
    [
      open,

      destinationLocation
        ?.apiSearchKeyword,

      destinationLocation
        ?.region,

      destinationLocation
        ?.detail,

      destinationLocation
        ?.latitude,

      destinationLocation
        ?.longitude,
    ],
  );


  /*
   * 드래그/ESC 처리
   */
  useEffect(
    () => {
      if (!open) {
        return undefined;
      }


      const finishDrag =
        () => {
          dragState.current =
            null;
        };


      const closeWithEscape =
        (event) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(
              false,
            );
          }
        };


      window.addEventListener(
        "pointerup",
        finishDrag,
      );


      window.addEventListener(
        "keydown",
        closeWithEscape,
      );


      return () => {
        window.removeEventListener(
          "pointerup",
          finishDrag,
        );

        window.removeEventListener(
          "keydown",
          closeWithEscape,
        );
      };
    },
    [
      open,
    ],
  );


  const openPicker =
    () => {
      setDraftStart(
        startDate ||
          today,
      );

      setDraftEnd(
        endDate ||
          "",
      );

      setDraftStartTime(
        startTime ||
          "09:00",
      );

      setDraftEndTime(
        endTime ||
          "18:00",
      );

      setCursorMonth(
        monthStart(
          fromIso(
            startDate,
          ) ||
            new Date(),
        ),
      );

      setOpen(
        true,
      );
    };


  const selectDate =
    (iso) => {
      if (
        dragged.current
      ) {
        dragged.current =
          false;

        return;
      }


      if (
        !draftStart ||
        draftEnd
      ) {
        setDraftStart(
          iso,
        );

        setDraftEnd(
          "",
        );

        return;
      }


      if (
        iso <
        draftStart
      ) {
        setDraftStart(
          iso,
        );

        setDraftEnd(
          "",
        );

        return;
      }


      setDraftEnd(
        iso,
      );
    };


  const beginDrag =
    (iso) => {
      dragState.current =
        iso;

      dragged.current =
        false;
    };


  const extendDrag =
    (iso) => {
      const anchor =
        dragState.current;


      if (
        !anchor ||
        anchor === iso
      ) {
        return;
      }


      dragged.current =
        true;


      setDraftStart(
        anchor < iso
          ? anchor
          : iso,
      );


      setDraftEnd(
        anchor < iso
          ? iso
          : anchor,
      );
    };


  const changeMonth =
    (amount) => {
      const next =
        addMonths(
          cursorMonth,
          amount,
        );


      if (
        next <
          minMonth ||
        next >
          maxMonth
      ) {
        return;
      }


      setCursorMonth(
        next,
      );
    };


  const confirm =
    () => {
      if (
        !draftStart ||
        !draftEnd
      ) {
        return;
      }


      onConfirm?.({
        startDate:
          draftStart,

        endDate:
          draftEnd,

        ...(showTimeFields
          ? {
              startTime:
                draftStartTime,

              endTime:
                draftEndTime,
            }
          : {}),
      });


      setOpen(
        false,
      );
    };


  return (
    <>
      <label className="date-field trip-date-field">
        <small>
          <b>
            여행 날짜
          </b>
          출발일과 도착일을 한 번에 선택해 주세요
        </small>

        {travelers &&
        !endDate ? (
          <aside
            className="date-ai-guide"
            role="status"
          >
            <span>
              AI 안내
            </span>

            <b>
              출발일과 도착일을 정해주세요!
            </b>
          </aside>
        ) : null}

        <button
          type="button"
          className="trip-date-range-trigger"
          onClick={
            openPicker
          }
        >
          <span>
            <b>
              출발
            </b>

            <small>
              {formatDate(
                startDate,
              )}
            </small>

            {showTimeFields ? (
              <em>
                {startTime}
              </em>
            ) : null}
          </span>

          <i>
            →
          </i>

          <span>
            <b>
              도착
            </b>

            <small>
              {formatDate(
                endDate,
              )}
            </small>

            {showTimeFields &&
            endDate ? (
              <em>
                {endTime}
              </em>
            ) : null}
          </span>

          <CalendarDays
            size={20}
            aria-hidden="true"
          />
        </button>

        {showTimeFields ? (
          <small className="direct-time-note">
            항공 외 이동을 선택해 직접 출발·도착 시간을 설정했어요.
          </small>
        ) : null}
      </label>


      {open
        ? createPortal(
            (
              <div
                className="trip-calendar-backdrop"
                role="presentation"
                onMouseDown={(
                  event,
                ) => {
                  if (
                    event.target ===
                    event.currentTarget
                  ) {
                    setOpen(
                      false,
                    );
                  }
                }}
              >
                <section
                  className="trip-calendar-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="trip-calendar-title"
                >
                  <header className="trip-calendar-header">
                    <div>
                      <span>
                        <CalendarDays
                          size={
                            17
                          }
                        />{" "}
                        여행 일정
                      </span>

                      <h2 id="trip-calendar-title">
                        출발일과 도착일을 선택하세요.
                      </h2>

                      <p>
                        날짜를 두 번 누르거나 드래그해서 여행 기간을 정할 수 있어요.
                      </p>
                    </div>

                    <div className="trip-calendar-controls">
                      <button
                        type="button"
                        onClick={() =>
                          changeMonth(
                            -1,
                          )
                        }
                        disabled={
                          cursorMonth <=
                          minMonth
                        }
                        aria-label="이전 달"
                      >
                        <ChevronLeft
                          size={
                            18
                          }
                        />
                      </button>

                      <select
                        value={
                          cursorMonth.getFullYear()
                        }
                        onChange={(
                          event,
                        ) => {
                          const year =
                            Number(
                              event
                                .target
                                .value,
                            );

                          const firstMonth =
                            year ===
                            minMonth.getFullYear()
                              ? minMonth.getMonth()
                              : 0;

                          const lastMonth =
                            year ===
                            maxMonth.getFullYear()
                              ? maxMonth.getMonth()
                              : 11;

                          setCursorMonth(
                            new Date(
                              year,

                              Math.min(
                                Math.max(
                                  cursorMonth.getMonth(),
                                  firstMonth,
                                ),

                                lastMonth,
                              ),

                              1,
                            ),
                          );
                        }}
                        aria-label="연도 선택"
                      >
                        {selectableYears.map(
                          (
                            year,
                          ) => (
                            <option
                              key={
                                year
                              }
                              value={
                                year
                              }
                            >
                              {
                                year
                              }
                              년
                            </option>
                          ),
                        )}
                      </select>

                      <select
                        value={
                          cursorMonth.getMonth()
                        }
                        onChange={(
                          event,
                        ) =>
                          setCursorMonth(
                            new Date(
                              cursorMonth.getFullYear(),

                              Number(
                                event
                                  .target
                                  .value,
                              ),

                              1,
                            ),
                          )
                        }
                        aria-label="월 선택"
                      >
                        {selectableMonths.map(
                          (
                            month,
                          ) => (
                            <option
                              key={
                                month
                              }
                              value={
                                month
                              }
                            >
                              {month +
                                1}
                              월
                            </option>
                          ),
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          changeMonth(
                            1,
                          )
                        }
                        disabled={
                          cursorMonth >=
                          maxMonth
                        }
                        aria-label="다음 달"
                      >
                        <ChevronRight
                          size={
                            18
                          }
                        />
                      </button>

                      <button
                        type="button"
                        className="trip-calendar-close"
                        onClick={() =>
                          setOpen(
                            false,
                          )
                        }
                        aria-label="달력 닫기"
                      >
                        <X
                          size={
                            18
                          }
                        />
                      </button>
                    </div>
                  </header>

                  {weatherNotice ? (
                    <div className="trip-calendar-weather-notice" role="status">
                      <span aria-hidden="true">☀</span>
                      {weatherNotice}
                    </div>
                  ) : null}


                  <div className="trip-calendar-body">
                    {[
                      cursorMonth,

                      addMonths(
                        cursorMonth,
                        1,
                      ),
                    ]
                      .filter(
                        (
                          month,
                        ) =>
                          month <=
                          maxMonth,
                      )
                      .map(
                        (
                          month,
                        ) => (
                          <CalendarMonth
                            key={`${month.getFullYear()}-${month.getMonth()}`}
                            month={
                              month
                            }
                            minDate={
                              today
                            }
                            maxDate={
                              maxDate
                            }
                            start={
                              draftStart
                            }
                            end={
                              draftEnd
                            }
                            weatherByDate={
                              weatherByDate
                            }
                            dragState={
                              dragState
                            }
                            onDateClick={
                              selectDate
                            }
                            onDateEnter={
                              extendDrag
                            }
                            onDatePointerDown={
                              beginDrag
                            }
                          />
                        ),
                      )}
                  </div>


                  <footer className="trip-calendar-footer">
                    {showTimeFields ? (
                      <div className="trip-calendar-time-group">
                        <TimeSelect
                          label="출발 시간"
                          value={
                            draftStartTime
                          }
                          onChange={
                            setDraftStartTime
                          }
                        />

                        <TimeSelect
                          label="도착 시간"
                          value={
                            draftEndTime
                          }
                          onChange={
                            setDraftEndTime
                          }
                        />
                      </div>
                    ) : (
                      <small>
                        시간은 교통수단을 고른 뒤 확정해요.
                      </small>
                    )}

                    <div className="trip-calendar-confirm">
                      <small>
                        {formatDate(
                          draftStart,
                        )}{" "}
                        →{" "}
                        {formatDate(
                          draftEnd,
                        )}
                      </small>

                      <button
                        type="button"
                        disabled={
                          !draftStart ||
                          !draftEnd
                        }
                        onClick={
                          confirm
                        }
                      >
                        선택 완료
                      </button>
                    </div>
                  </footer>
                </section>
              </div>
            ),
            document.body,
          )
        : null}
    </>
  );
}
