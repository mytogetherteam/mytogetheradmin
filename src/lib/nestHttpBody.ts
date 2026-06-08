/**
 * Turn NestJS HttpException / class-validator payloads into one readable line
 * (`message` arrays, `{ property, constraints }[]`, Laravel-style envelopes).
 */

type ValidationLike = {
  property?: string;
  propertyPath?: string;
  constraints?: Record<string, string>;
};

type ExcelImportLikeMessage = {
  code?: string;
  detail?: string;
  sheet?: string;
  row?: number;
  message?: string;
};

export function formatExcelImportLikeMessage(item: ExcelImportLikeMessage): string {
  const detail = typeof item.detail === 'string' ? item.detail.trim() : '';
  if (detail) {
    const meta: string[] = [];
    if (item.code) meta.push(item.code);
    if (item.sheet) meta.push(`sheet: ${item.sheet}`);
    if (item.row != null) meta.push(`row: ${item.row}`);
    return meta.length ? `${meta.join(' · ')} — ${detail}` : detail;
  }
  if (typeof item.message === 'string' && item.message.trim()) {
    return item.message.trim();
  }
  return '';
}

function formatValidationChunk(item: ValidationLike): string {
  const prop = item.property ?? item.propertyPath ?? '';
  const constraints = item.constraints;
  if (!constraints || typeof constraints !== 'object') return '';
  const text = Object.values(constraints).join('; ');
  return prop ? `${prop}: ${text}` : text;
}

function stringifyMessageField(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const parts = value.map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return String(item);
      if ('constraints' in item && (item as ValidationLike).constraints) {
        const line = formatValidationChunk(item as ValidationLike);
        if (line) return line;
      }
      return JSON.stringify(item);
    });
    return parts.filter(Boolean).join(' · ');
  }
  return String(value);
}

/** `{ field: ["msg1"], ... }` or string / string[] */
function stringifyErrorsField(errors: unknown): string {
  if (errors === null || errors === undefined) return '';
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) {
    const lines = errors.map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return String(item ?? '');
      const importLine = formatExcelImportLikeMessage(item as ExcelImportLikeMessage);
      if (importLine) return importLine;
      if ('constraints' in item && (item as ValidationLike).constraints) {
        const line = formatValidationChunk(item as ValidationLike);
        if (line) return line;
      }
      return JSON.stringify(item);
    });
    const filtered = lines.filter(Boolean);
    if (filtered.length > 1 && filtered.every((line) => !line.startsWith('{'))) {
      return filtered.map((line, i) => `${i + 1}. ${line}`).join('\n');
    }
    return filtered.join(' · ');
  }
  if (typeof errors === 'object') {
    const o = errors as Record<string, unknown>;
    return Object.entries(o)
      .map(([key, val]) => {
        const text = Array.isArray(val)
          ? val
            .filter((x): x is string => typeof x === 'string')
            .join('; ')
          : val != null && typeof val === 'object'
            ? JSON.stringify(val)
            : String(val ?? '');
        return text.trim() ? `${key}: ${text}` : '';
      })
      .filter(Boolean)
      .join(' · ');
  }
  return String(errors);
}

/** Nest/Express default `error` strings — omit; they duplicate status and add no detail. */
const REDUNDANT_HTTP_ERROR_LABEL = new Set(
  [
    'Bad Request',
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Method Not Allowed',
    'Conflict',
    'Unprocessable Entity',
    'Internal Server Error',
    'Service Unavailable',
    'Too Many Requests',
  ].map((s) => s.toLowerCase()),
);

function isRedundantErrorLabel(label: string): boolean {
  return REDUNDANT_HTTP_ERROR_LABEL.has(label.trim().toLowerCase());
}

type NestLikeErrorBody = {
  message?: unknown;
  error?: unknown;
  details?: unknown;
  description?: unknown;
  /** Laravel-style `{ success:false, errors }` or field map */
  errors?: unknown;
};

/** Single human-readable sentence from JSON error bodies (Nest, validation, etc.). */
export function getHumanMessageFromNestHttpBody(body: unknown): string {
  if (body === null || typeof body !== 'object') return '';
  const b = body as NestLikeErrorBody;
  const chunks: string[] = [];

  const msg = stringifyMessageField(b.message).trim();
  if (msg) chunks.push(msg);

  const shortError =
    typeof b.error === 'string' ? b.error.trim() : '';
  if (
    shortError &&
    !isRedundantErrorLabel(shortError) &&
    !msg.includes(shortError)
  ) {
    chunks.push(`(${shortError})`);
  }

  const details = stringifyMessageField(b.details).trim();
  if (details) chunks.push(details);

  const description = stringifyMessageField(b.description).trim();
  if (description) chunks.push(description);

  const errors = stringifyErrorsField(b.errors).trim();
  if (errors) chunks.push(errors);

  return chunks.join(' ');
}
