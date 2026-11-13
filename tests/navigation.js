// Use the visible native chapter link and ignore the hidden desktop/mobile duplicate.
export async function chapterLink(page, key) {
  const mobileLink = page.locator(`[data-mobile-chapter="${key}"]`);
  return await mobileLink.isVisible()
    ? mobileLink
    : page.locator(`[data-chapter-item="${key}"]`);
}
