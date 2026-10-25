import { Result, Schema } from "effect";

const JSON_INDENT = 2;

const printJson = Schema.encodeUnknownResult(
  Schema.fromJsonString(Schema.Unknown, { space: JSON_INDENT }),
);

const formatJson = (value: unknown): string => Result.getOrElse(printJson(value), () => "");

export { formatJson };
