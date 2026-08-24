import { expect, test } from "@playwright/test";

test("landing page is honest and never exposes a placeholder WhatsApp link", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Circuit for Indian SMBs/i }),
  ).toBeVisible();
  await expect(page.getByText(/Phase 1 Early Access/i)).toBeVisible();

  const hrefs = await page.locator("a").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href") || ""),
  );
  expect(hrefs.some((href) => href.includes("XXXXXXXXXX"))).toBe(false);
});

test("WhatsApp webhook readiness reports missing configuration without secrets", async ({
  request,
}) => {
  const response = await request.get("/api/whatsapp/webhook");
  expect([200, 503]).toContain(response.status());

  const body = await response.json();
  expect(body).toMatchObject({
    service: "gupshup-webhook",
    callbackVersion: 2,
  });
  expect(JSON.stringify(body)).not.toContain("GUPSHUP_API_KEY=");
  expect(JSON.stringify(body)).not.toContain("GUPSHUP_WEBHOOK_SECRET=");
});
