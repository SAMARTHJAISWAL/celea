import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedMediaHosts, isAllowedMediaUrl } from "../src/lib/media-url.ts";

const hosts = allowedMediaHosts({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" });

test("allows Supabase storage and Google AI URLs over https", () => {
  assert.ok(isAllowedMediaUrl("https://abc.supabase.co/storage/v1/object/public/celea-media/a.png", hosts));
  assert.ok(isAllowedMediaUrl("https://generativelanguage.googleapis.com/v1beta/files/x:download", hosts));
});

test("rejects other hosts, http, and garbage", () => {
  assert.equal(isAllowedMediaUrl("https://evil.example.com/a.png", hosts), false);
  assert.equal(isAllowedMediaUrl("http://abc.supabase.co/a.png", hosts), false);
  assert.equal(isAllowedMediaUrl("http://169.254.169.254/latest/meta-data", hosts), false);
  assert.equal(isAllowedMediaUrl("https://abc.supabase.co.evil.com/a.png", hosts), false);
  assert.equal(isAllowedMediaUrl("not a url", hosts), false);
});
