import type { Page } from 'playwright';

// Magister fork: a cookie-consent dialog over the hero ruins a brand
// screenshot, and its buttons leak into the branding script's colour
// sampling. The cloud engine strips these in Chrome; here the well-known
// consent managers are hidden with CSS, after the page text has been
// captured and before the screenshot and branding script run. Hiding never
// clicks anything, so no consent is granted or refused on the site owner's
// behalf.
const CONSENT_SELECTORS = [
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '.onetrust-pc-dark-filter',
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBodyUnderlay',
  '#cookie-law-info-bar',
  '.cky-consent-container',
  '.cky-overlay',
  '.cc-window',
  '.cc-banner',
  '#cookieConsent',
  '#cookie-consent',
  '#cookie-banner',
  '#cookieBanner',
  '.cookie-banner',
  '.cookie-consent',
  '.cookie-notice',
  '#cookie-notice',
  '#truste-consent-track',
  '.truste_overlay',
  '.truste_box_overlay',
  '#qc-cmp2-container',
  '.qc-cmp2-container',
  '#didomi-host',
  '.didomi-popup-backdrop',
  '#usercentrics-root',
  '#usercentrics-cmp-ui',
  '.osano-cm-window',
  '.osano-cm-dialog',
  '#termly-code-snippet-support',
  '.termly-styles-root',
  '.iubenda-cs-container',
  '#iubenda-cs-banner',
  '.klaro',
  '#klaro',
  '.cmplz-cookiebanner',
  '#cmplz-cookiebanner-container',
  '#shopify-pc__banner',
  '.shopify-pc__banner',
  '#gdpr-cookie-message',
  '.gdpr-banner',
  '#hs-eu-cookie-confirmation',
  '#axeptio_overlay',
  '#consent-banner',
  '[aria-label="cookieconsent"]',
  '[data-testid="cookie-banner"]',
  '[id^="sp_message_container_"]',
  '.sp-message-open',
  '.pum-overlay',
];

export const CONSENT_HIDE_CSS = `${CONSENT_SELECTORS.join(',\n')} { display: none !important; visibility: hidden !important; }
html, body { overflow: visible !important; }`;

/** Best effort: a page that refuses the style tag is left as it is. */
export const hideConsentDialogs = async (page: Page): Promise<void> => {
  try {
    await page.addStyleTag({ content: CONSENT_HIDE_CSS });
  } catch (error) {
    console.warn(
      'Consent hide skipped:',
      error instanceof Error ? error.message : String(error),
    );
  }
};
