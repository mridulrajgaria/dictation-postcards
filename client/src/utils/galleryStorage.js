const GALLERY_STORAGE_KEY = 'dictation_postcards_gallery';
const MAX_GALLERY_ITEMS = 12;

/**
 * Loads saved postcards from localStorage with fallback for errors or unavailable storage.
 *
 * @returns {Array} Array of postcard objects
 */
export function loadSavedPostcards() {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Unable to load postcards from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new postcard to localStorage gallery with quota management.
 * If quota is exceeded, older entries are progressively trimmed.
 *
 * @param {Object} newEntry - { id, dataUrl, postcardData, text, caption, date }
 * @returns {Array} Updated array of saved postcards
 */
export function savePostcardToGallery(newEntry) {
  if (!newEntry) return loadSavedPostcards();

  let gallery = loadSavedPostcards();

  // Avoid duplicate by id
  gallery = gallery.filter((item) => item.id !== newEntry.id);
  // Prepend newest entry
  gallery.unshift(newEntry);

  // Limit initial size
  if (gallery.length > MAX_GALLERY_ITEMS) {
    gallery = gallery.slice(0, MAX_GALLERY_ITEMS);
  }

  // Attempt to save, progressively pruning oldest items if localStorage is full
  while (gallery.length > 0) {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
      return gallery;
    } catch (err) {
      const isQuotaExceeded =
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014;

      if (isQuotaExceeded && gallery.length > 1) {
        // Drop the oldest saved card and retry
        console.warn('LocalStorage quota exceeded. Trimming oldest postcard entry...');
        gallery.pop();
      } else if (isQuotaExceeded && gallery.length === 1) {
        // If even 1 item with dataURL exceeds quota, try stripping dataUrl
        console.warn('LocalStorage full. Saving metadata without PNG data URL.');
        gallery[0].dataUrl = null;
        try {
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
        } catch {
          // If storage is completely disabled or full, return in-memory gallery
        }
        return gallery;
      } else {
        // Storage unavailable or disabled
        console.warn('Storage unavailable:', err);
        return gallery;
      }
    }
  }

  return [];
}
