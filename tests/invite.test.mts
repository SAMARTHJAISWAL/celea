import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInviteCodes, verifyInviteCode } from "../src/lib/invite-codes.ts";
import {
  getInviteSecret,
  signCookieValue,
  verifyCookieValue,
} from "../src/lib/invite-cookie.ts";

test("parseInviteCodes keeps only valid 6-char codes, case-insensitive", () => {
  const codes = parseInviteCodes(" abc123, TOOLONG1 ,x, ZZZ999 ,");
  assert.deepEqual([...codes].sort(), ["ABC123", "ZZZ999"]);
});

test("verifyInviteCode checks against the configured list", () => {
  assert.equal(verifyInviteCode("abc123", "ABC123,DEF456"), true);
  assert.equal(verifyInviteCode(" def456 ", "ABC123,DEF456"), true);
  assert.equal(verifyInviteCode("XYZ000", "ABC123"), false);
  assert.equal(verifyInviteCode("ABC123", undefined), false);
  assert.equal(verifyInviteCode("ABC123", ""), false);
  assert.equal(verifyInviteCode(123456, "ABC123"), false);
});

test("getInviteSecret fails closed in production without INVITE_SECRET", () => {
  assert.equal(getInviteSecret({ NODE_ENV: "production" }), null);
  assert.equal(getInviteSecret({ NODE_ENV: "production", INVITE_SECRET: "s" }), "s");
  assert.ok(getInviteSecret({ NODE_ENV: "development" }));
});

test("signed cookies verify and reject tampering", async () => {
  const signed = await signCookieValue("token123", "secret");
  assert.equal(await verifyCookieValue(signed, "secret"), true);
  assert.equal(await verifyCookieValue(signed, "other-secret"), false);
  assert.equal(await verifyCookieValue(signed.replace("token123", "token124"), "secret"), false);
  assert.equal(await verifyCookieValue("no-signature", "secret"), false);
  assert.equal(await verifyCookieValue("a.b.c", "secret"), false);
});
