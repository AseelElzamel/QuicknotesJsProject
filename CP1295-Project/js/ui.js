/**
 * ui.js - UI management and event handlers
 * Functions for handling the user interface elements and interactions
 */

import { NoteManager, createNote } from './notes.js';
import { saveNotes, exportNotesAsJson } from './storage.js';

/**
 * Initialize UI event listeners
 * @param {NoteManager} noteManager - The note manager instance
 */
export function initializeUI(noteManager) {
    const noteBoard = document.getElementById('note-board');
    const exportBtn = document.getElementById('export-btn');

    // Double click on board to create a new note
    noteBoard.addEventListener('dblclick', (event) => {
        // Only create note if we clicked directly on the board, not on an existing note
        if (event.target === noteBoard) {
            createNewNote(event.clientX, event.clientY, noteManager);
        }
    });

    setTimeout(() => {
        const sortAscBtn = document.getElementById('sort-asc-btn');
        const sortDescBtn = document.getElementById('sort-desc-btn');

        if (sortAscBtn && sortDescBtn) {
        //click button to sort notes asc
        sortAscBtn.addEventListener('click', () => {
            console.log("sort asc clicked");
            sortNotesByTimestamp(noteManager,'asc');
        });

        //click button to sort notes desc
        sortDescBtn.addEventListener('click', () => {
            console.log("sort desc clicked");
            sortNotesByTimestamp(noteManager,'desc');
        });
    } else {
        console.warn("sort buttons not found in dom")
    }
    }, 0);

    // Export button click handler
    exportBtn.addEventListener('click', () => {
        exportNotes(noteManager);
    });

    // Setup auto-save timer
    setupAutoSave(noteManager);
}

/**
 * Create a new note at the specified position
 * @param {number} x - X position for the new note
 * @param {number} y - Y position for the new note
 * @param {NoteManager} noteManager - The note manager instance
 */
export function createNewNote(x, y, noteManager) {
    // Calculate position relative to the board
    const noteBoard = document.getElementById('note-board');
    const boardRect = noteBoard.getBoundingClientRect();
    
    const boardX = x - boardRect.left;
    const boardY = y - boardRect.top;
    
    // Create the new note
    const note = createNote({
        content: '',
        x: boardX,
        y: boardY
    });
    
    // Add to manager
    noteManager.addNote(note);
    
    // Create DOM element
    const noteElement = note.createElement();
    
    // Add event listeners to the note
    setupNoteEventListeners(noteElement, note, noteManager);
    
    // Add to board
    noteBoard.appendChild(noteElement);

    const timestampElement = document.createElement('div');
    timestampElement.className = 'note-timestamp';
    timestampElement.textContent = new Date(note.timestamp).toLocaleString();
    noteElement.appendChild(timestampElement);
    
    // Focus the content area for immediate editing
    const contentElement = noteElement.querySelector('.note-content');
    contentElement.focus();
    
    return note;
}

/**
 * Set up event listeners for a note element
 * @param {HTMLElement} noteElement - The note DOM element
 * @param {Note} note - The note object
 * @param {NoteManager} noteManager - The note manager instance
 */
export function setupNoteEventListeners(noteElement, note, noteManager) {
    // Get elements
    const contentElement = noteElement.querySelector('.note-content');
    const deleteButton = noteElement.querySelector('.delete-btn');
    const quoteButton = noteElement.querySelector('.quote-btn');
    const imageButton = noteElement.querySelector('.image-btn');

    // Track whether the note is being dragged
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    
    // Content change handler
    contentElement.addEventListener('input', () => {
        note.updateContent(contentElement.textContent);
    });
    
    // Delete button handler
    deleteButton.addEventListener('click', () => {
        deleteNote(noteElement, note, noteManager);
    });
    
    // Quote button handler
    quoteButton.addEventListener('click', async () => {
        try {
            quoteButton.textContent = '⌛'; // Show loading indicator
            await note.addRandomQuote();
            quoteButton.textContent = '💡'; // Restore original icon
        } catch (error) {
            // Show error indicator briefly
            quoteButton.textContent = '❌';
            setTimeout(() => {
                quoteButton.textContent = '💡';
            }, 1500);
            
            // Display error in console
            console.error('Failed to fetch quote:', error);
        }
    });

    imageButton.addEventListener('click', async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const imageDateUrl = reader.result;
                note.setImage(imageDateUrl);
            };
            reader.readAsDataURL(file);
        });
    });

    // Drag start
    noteElement.addEventListener('mousedown', (event) => {
        // Ignore if clicking on buttons or content area
        if (event.target === deleteButton || 
            event.target === quoteButton ||
            event.target === contentElement) {
            return;
        }
        
        // Start dragging
        isDragging = true;
        
        // Calculate offset from note's top-left corner
        const noteRect = noteElement.getBoundingClientRect();
        dragOffsetX = event.clientX - noteRect.left;
        dragOffsetY = event.clientY - noteRect.top;
        
        // Add active class for styling
        noteElement.classList.add('note-active');
        
        // Prevent text selection during drag
        event.preventDefault();
    });
    
    // Drag move
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        // Get board position and dimensions
        const noteBoard = document.getElementById('note-board');
        const boardRect = noteBoard.getBoundingClientRect();
        
        // Calculate new position relative to board
        let newX = event.clientX - boardRect.left - dragOffsetX;
        let newY = event.clientY - boardRect.top - dragOffsetY;
        
        // Keep note within board boundaries
        newX = Math.max(0, Math.min(newX, boardRect.width - noteElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, boardRect.height - noteElement.offsetHeight));
        
        // Update note position
        note.updatePosition(newX, newY);
    });
    
    // Drag end
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            noteElement.classList.remove('note-active');
        }
    });
}

/**
 * Delete a note
 * @param {HTMLElement} noteElement - The note DOM element
 * @param {Note} note - The note object
 * @param {NoteManager} noteManager - The note manager instance
 */
export function deleteNote(noteElement, note, noteManager) {
    // Add fade-out animation
    noteElement.classList.add('note-fade-out');
    
    // Remove after animation completes
    noteElement.addEventListener('animationend', () => {
        // Remove from DOM
        noteElement.remove();
        
        // Remove from manager
        noteManager.removeNote(note.id);
    });
}

/**
 * Export all notes as JSON file
 * @param {NoteManager} noteManager - The note manager instance
 */
export function exportNotes(noteManager) {
    const notes = noteManager.toJSON();
    exportNotesAsJson(notes);
}

/**
 * Setup auto-save functionality
 * @param {NoteManager} noteManager - The note manager instance
 */
export function setupAutoSave(noteManager) {
    // Save every 5 seconds if there are changes
    setInterval(() => {
        const notes = noteManager.toJSON();
        saveNotes(notes);
    }, 5000);
}

/**
 * Render all notes from manager to the board
 * @param {NoteManager} noteManager - The note manager instance
 */
export function renderAllNotes(noteManager) {
    const noteBoard = document.getElementById('note-board');
    
    // Clear existing notes
    const existingNotes = noteBoard.querySelectorAll('.note');
    existingNotes.forEach(noteElement => {
        noteElement.remove();
    });
    
    // Render all notes
    noteManager.getAllNotes().forEach(note => {
        const noteElement = note.createElement();
        setupNoteEventListeners(noteElement, note, noteManager);
        noteBoard.appendChild(noteElement);

        //to rerender the timestamp on reload
        const timestampElement = document.createElement('div');
        timestampElement.className = 'note-timestamp';
        timestampElement.textContent = new Date(note.timestamp).toLocaleString();
        noteElement.appendChild(timestampElement);
    });
}


/**
 * Sort and re-render notes by timestamp
 * @param {NoteManager} noteManager
 * @param {'asc' | 'desc'} order
 */
function sortNotesByTimestamp(noteManager, order = 'asc') {
    // Sort notes
    const sortedNotes = noteManager.getAllNotes().sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    });
  
    // Clear old notes from manager and board
    noteManager.notes.clear();
  
    const noteBoard = document.getElementById('note-board');
    noteBoard.innerHTML = '';
  
    // Re-add sorted notes
    // the notes are not being to positioned so i will explicitly reposition the notes
    let offsetY = 20;
    const gap = 20;
    const fixedTop = 20;

    sortedNotes.forEach(note => {
      noteManager.addNote(note); // to update internal map
  
      const noteElement = note.createElement();
      setupNoteEventListeners(noteElement, note, noteManager);
  
      const timestampElement = document.createElement('div');
      timestampElement.className = 'note-timestamp';
      timestampElement.textContent = new Date(note.timestamp).toLocaleString();
      noteElement.appendChild(timestampElement);
  
      note.updatePosition(20, offsetY);
      offsetY += noteElement.offsetHeight + gap;

      noteBoard.appendChild(noteElement);
    });
}