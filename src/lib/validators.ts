type YachtPayload = {
  name: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  length: string;
  capacity: number;
  condition: "NEW" | "USED";
  location: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  status: "DRAFT" | "AVAILABLE" | "SOLD";
};

type InquiryPayload = {
  yachtId: string;
  customerName: string;
  email: string;
  phone: string;
  message: string;
};

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function findValidationError(results: ValidationResult<unknown>[]) {
  const failed = results.find((result) => !result.ok);
  return failed && !failed.ok ? failed.error : null;
}

function unwrapValidation<T>(result: ValidationResult<T>) {
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} 为必填项` };
  }

  return { ok: true, value: value.trim() };
}

function readNumber(value: unknown, field: string): ValidationResult<number> {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { ok: false, error: `${field} 必须为数字` };
  }

  return { ok: true, value };
}

function readPositiveInteger(value: unknown, field: string): ValidationResult<number> {
  const result = readNumber(value, field);

  if (!result.ok) {
    return result;
  }

  if (!Number.isInteger(result.value) || result.value <= 0) {
    return { ok: false, error: `${field} 必须为正整数` };
  }

  return { ok: true, value: result.value };
}

function readPositiveDecimal(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== "number" && typeof value !== "string") {
    return { ok: false, error: `${field} 必须为数字或数字字符串` };
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return { ok: false, error: `${field} 必须大于 0` };
  }

  return { ok: true, value: parsed.toFixed(2) };
}

function readStringArray(value: unknown, field: string): ValidationResult<string[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: `${field} 必须为字符串数组` };
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return { ok: true, value: items };
}

export function validateYachtPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return { ok: false as const, error: "请求体必须为 JSON 对象" };
  }

  const name = readString(payload.name, "name");
  const brand = readString(payload.brand, "brand");
  const model = readString(payload.model, "model");
  const year = readPositiveInteger(payload.year, "year");
  const price = readPositiveDecimal(payload.price, "price");
  const length = readPositiveDecimal(payload.length, "length");
  const capacity = readPositiveInteger(payload.capacity, "capacity");
  const location = readString(payload.location, "location");
  const description = readString(payload.description, "description");
  const coverImage = readString(payload.coverImage, "coverImage");
  const galleryImages = readStringArray(payload.galleryImages ?? [], "galleryImages");

  const allowedConditions = new Set(["NEW", "USED"]);
  const allowedStatuses = new Set(["DRAFT", "AVAILABLE", "SOLD"]);
  const fieldError = findValidationError([
    name,
    brand,
    model,
    year,
    price,
    length,
    capacity,
    location,
    description,
    coverImage,
    galleryImages,
  ]);

  if (fieldError) {
    return {
      ok: false as const,
      error: fieldError,
    };
  }

  if (typeof payload.condition !== "string" || !allowedConditions.has(payload.condition)) {
    return { ok: false as const, error: "condition 必须为 NEW 或 USED" };
  }

  if (typeof payload.status !== "string" || !allowedStatuses.has(payload.status)) {
    return { ok: false as const, error: "status 必须为 DRAFT、AVAILABLE 或 SOLD" };
  }

  const value: YachtPayload = {
    name: unwrapValidation(name),
    brand: unwrapValidation(brand),
    model: unwrapValidation(model),
    year: unwrapValidation(year),
    price: unwrapValidation(price),
    length: unwrapValidation(length),
    capacity: unwrapValidation(capacity),
    condition: payload.condition as YachtPayload["condition"],
    location: unwrapValidation(location),
    description: unwrapValidation(description),
    coverImage: unwrapValidation(coverImage),
    galleryImages: unwrapValidation(galleryImages),
    status: payload.status as YachtPayload["status"],
  };

  return { ok: true as const, value };
}

export function validateInquiryPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return { ok: false as const, error: "请求体必须为 JSON 对象" };
  }

  const yachtId = readString(payload.yachtId, "yachtId");
  const customerName = readString(payload.customerName, "customerName");
  const email = readString(payload.email, "email");
  const phone = readString(payload.phone, "phone");
  const message = readString(payload.message, "message");
  const fieldError = findValidationError([yachtId, customerName, email, phone, message]);

  if (fieldError) {
    return {
      ok: false as const,
      error: fieldError,
    };
  }

  const value: InquiryPayload = {
    yachtId: unwrapValidation(yachtId),
    customerName: unwrapValidation(customerName),
    email: unwrapValidation(email),
    phone: unwrapValidation(phone),
    message: unwrapValidation(message),
  };

  return { ok: true as const, value };
}
