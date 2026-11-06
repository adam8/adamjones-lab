// Use the public, currently rendered navigation; never focus hidden duplicates.
export async function chapterLink(page, key) {
  const disclosure = page.locator('#mobile-chapters');
  if (await disclosure.isVisible()) {
    await openChapters(page);
    return disclosure.locator(`a[href="#${key}"]`);
  }
  return page.locator(`[data-chapter-item="${key}"]`);
}
export async function openChapters(page) {
  const disclosure = page.locator('#mobile-chapters');
  if (await disclosure.isVisible() && (await disclosure.getAttribute('open')) === null) {
    await disclosure.locator('summary').click();
  }
}
