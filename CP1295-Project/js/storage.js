/**
 * storage.js - Local storage management
 * Functions for saving and loading notes from localStorage
 */

const STORAGE_KEY = 'quicknotes_data';

/**
 * Save notes to localStorage
 * @param {Array} notes - Array of note objects to save
 * @returns {boolean} True if save was successful
 */
export function saveNotes(notes) {
    try {
        const notesJson = JSON.stringify(notes);
        localStorage.setItem(STORAGE_KEY, notesJson);
        return true;
    } catch (error) {
        console.error('Failed to save notes:', error);
        return false;
    }
}

/**
 * Load notes from localStorage
 * @returns {Array|null} Array of note objects or null if none found
 */
export function loadNotes() {
    try {
        const notesJson = localStorage.getItem(STORAGE_KEY);
        if (!notesJson) {
            return null;
        }
        return JSON.parse(notesJson);
    } catch (error) {
        console.error('Failed to load notes:', error);
        return null;
    }
}

/**
 * Clear all notes from localStorage
 * @returns {boolean} True if clear was successful
 */
export function clearNotes() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear notes:', error);
        return false;
    }
}

/**
 * Export notes as JSON file for download
 * @param {Array} notes - Array of note objects to export
 * @param {string} filename - Name of the file to download
 */
export function exportNotesAsJson(notes, filename = 'my-notes.json') {
    try {
        // Format the JSON with indentation for better readability
        const notesJson = JSON.stringify(notes, null, 2);
        
        // Create a blob with the JSON data
        const blob = new Blob([notesJson], { type: 'application/json' });
        
        // Create a download link and trigger it
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Failed to export notes:', error);
        return false;
    }
}
