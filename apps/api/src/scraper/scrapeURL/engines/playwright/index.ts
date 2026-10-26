import { z } from "zod";
import { config } from "../../../../config";
import { EngineScrapeResult } from "..";
import { Meta } from "../..";
import { robustFetch } from "../../lib/fetch";
import { getInnerJson } from "@mendable/firecrawl-rs";
import { hasFormatOfType } from "../../../../lib/format-utils";

export async function scrapeURLWithPlaywright(
  meta: Meta,
): Promise<EngineScrapeResult> {
  const screenshotFormat = hasFormatOfType(meta.options.formats, "screenshot");
  const response = await robustFetch({
    url: config.PLAYWRIGHT_MICROSERVICE_URL!,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      url: meta.rewrittenUrl ?? meta.url,
      wait_after_load: meta.options.waitFor,
      timeout: meta.abort.scrapeTimeout(),
      headers: meta.options.headers,
      skip_tls_verification: meta.options.skipTlsVerification,
      // Magister fork: the Playwright service takes the screenshot and runs
      // the brand-kit script on the page it loaded, the way the cloud's CDP
      // engine does, so both formats work without fire-engine.
      ...(screenshotFormat
        ? { screenshot: { full_page: !!screenshotFormat.fullPage } }
        : {}),
      ...(hasFormatOfType(meta.options.formats, "branding")
        ? { branding: true }
        : {}),
    },
    method: "POST",
    logger: meta.logger.child("scrapeURLWithPlaywright/robustFetch"),
    schema: z.object({
      content: z.string(),
      pageStatusCode: z.number(),
      pageError: z.string().optional(),
      contentType: z.string().optional(),
      // Optional: older playwright-service builds don't send it.
      url: z.string().optional(),
      screenshot: z.string().optional(),
      screenshotError: z.string().optional(),
      branding: z.unknown().optional(),
      brandingError: z.string().optional(),
    }),
    mock: meta.mock,
    abort: meta.abort.asSignal(),
  });

  if (response.contentType?.includes("application/json")) {
    response.content = await getInnerJson(response.content);
  }

  if (response.screenshotError) {
    meta.logger.warn("Playwright service could not take the screenshot", {
      error: response.screenshotError,
    });
  }
  if (response.brandingError) {
    meta.logger.warn("Playwright service could not run the branding script", {
      error: response.brandingError,
    });
  }
  // The script's return rides in as a javascript return, where
  // deriveBrandingFromActions picks it up exactly as it does for chrome-cdp.
  const brandingReturn =
    response.branding && typeof response.branding === "object"
      ? { type: "object", value: response.branding }
      : undefined;

  return {
    // The landed URL reported by the service. Redirect threat and blocklist
    // re-checks compare it against the requested URL. Falls back to the
    // requested URL for older services or a non-http(s) value (about:blank).
    url: landedHttpUrl(response.url) ?? meta.rewrittenUrl ?? meta.url,
    html: response.content,
    statusCode: response.pageStatusCode,
    error: response.pageError,
    contentType: response.contentType,

    ...(response.screenshot ? { screenshot: response.screenshot } : {}),
    ...(brandingReturn
      ? {
          actions: {
            screenshots: [],
            scrapes: [],
            javascriptReturns: [brandingReturn],
            pdfs: [],
          },
        }
      : {}),

    proxyUsed: "basic",
  };
}

function landedHttpUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export function playwrightMaxReasonableTime(meta: Meta): number {
  return (meta.options.waitFor ?? 0) + 30000;
}
