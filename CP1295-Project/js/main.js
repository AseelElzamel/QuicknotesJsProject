/**
 * main.js - Main entry point for QuickNotes application
 * Initializes the application and connects all the modules
 */

import { Note, NoteManager } from './notes.js';
import { initializeUI, renderAllNotes } from './ui.js';
import { loadNotes, saveNotes } from './storage.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('QuickNotes application initializing...');
    
    // Create note manager
    const noteManager = new NoteManager();
    
    // Load saved notes from localStorage
    const savedNotes = loadNotes();
    
    if (savedNotes && Array.isArray(savedNotes)) {
        console.log(`Loaded ${savedNotes.length} notes from storage`);
        
        // Create Note objects from the saved data
        savedNotes.forEach(noteData => {
            const note = new Note(noteData);
            noteManager.addNote(note);
        });
        
        // Render the loaded notes
        renderAllNotes(noteManager);
    } else {
        console.log('No saved notes found, starting with empty board');
    }
    
    // Initialize UI components and event handlers
    initializeUI(noteManager);
    
    // Save notes when page is unloaded
    window.addEventListener('beforeunload', () => {
        const notes = noteManager.toJSON();
        saveNotes(notes);
    });
    
    console.log('QuickNotes application initialized successfully');
    
    // For development and debugging purposes
    window.quickNotes = {
        noteManager,
        Note
    };
});
