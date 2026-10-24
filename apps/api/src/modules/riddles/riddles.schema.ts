const eventParams = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

const currentParams = {
  type: "object",
  required: ["position"],
  properties: { position: { type: "integer", minimum: 1, maximum: 6 } },
} as const;

const riddleParams = {
  type: "object",
  required: ["id", "position"],
  properties: {
    id: { type: "string", format: "uuid" },
    position: { type: "integer", minimum: 1, maximum: 6 },
  },
} as const;

const scanParams = {
  type: "object",
  required: ["id", "code"],
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string", minLength: 1, maxLength: 255 },
  },
} as const;

const currentScanParams = {
  type: "object",
  required: ["code"],
  properties: { code: { type: "string", minLength: 1, maxLength: 255 } },
} as const;

const answerBody = {
  type: "object",
  required: ["answer"],
  additionalProperties: false,
  properties: { answer: { type: "string", minLength: 1, maxLength: 1000 } },
} as const;

export const riddlesSchema = {
  get: { params: eventParams },
  getCurrent: {},
  flip: { params: riddleParams },
  flipCurrent: { params: currentParams },
  answer: { params: riddleParams, body: answerBody },
  answerCurrent: { params: currentParams, body: answerBody },
  scan: { params: scanParams },
  scanCurrent: { params: currentScanParams },
} as const;
