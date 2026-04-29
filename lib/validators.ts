import { z } from "zod";

// Lenient: 3-20 chars, alphanumeric/underscore.
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "用户名至少 3 个字符")
  .max(20, "用户名最多 20 个字符")
  .regex(/^[A-Za-z0-9_]+$/, "用户名仅支持字母、数字和下划线");

// Lenient: at least 6 chars, no complexity rules.
export const passwordSchema = z.string().min(6, "密码至少 6 位").max(72, "密码过长");

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
