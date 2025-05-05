/**
 * UIManager
 *
 * Handles UI interactions and effects:
 * - Shows and hides alerts
 * - Manages modals
 * - Handles acknowledgements section
 */
const UIManager = (() => {
  /**
   * Show a custom alert to the user
   * @param {string} message - The message to display
   */
  function showAlert(message) {
    // Remove any existing alert
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    // Fade in
    setTimeout(() => {
      alertDiv.style.opacity = '1';
    }, 10);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      setTimeout(() => {
        alertDiv.remove();
      }, 500);
    }, 3000);
  }

  /**
   * Toggle acknowledgements section visibility
   */
  function toggleAcknowledgements() {
    const content = document.querySelector('.ack-content');
    const arrow = document.querySelector('.arrow');
    if (content && arrow) {
      content.classList.toggle('active');
      arrow.classList.toggle('active');
    }
  }

  /**
   * Initialize UI components and event listeners
   */
  function init() {
    // Initialize tagline spark effect
    const tagline = document.getElementById('tagline');
    if (tagline) {
      tagline.classList.add('sparked');
      setTimeout(() => {
        tagline.classList.remove('sparked');
      }, 2500);
    }

    // Set up acknowledgements toggle
    const ackHeader = document.getElementById('ack-header');
    if (ackHeader) {
      ackHeader.addEventListener('click', toggleAcknowledgements);
    }

    // Set up how-to modal
    const howToBtn = document.getElementById('how-to-btn');
    const howToModal = document.getElementById('how-to-modal');
    const modalClose = document.getElementById('modal-close');

    if (howToBtn && howToModal && modalClose) {
      howToBtn.addEventListener('click', () => {
        howToModal.style.display = 'flex';
      });

      modalClose.addEventListener('click', () => {
        howToModal.style.display = 'none';
      });

      howToModal.addEventListener('click', (e) => {
        if (e.target === howToModal) {
          howToModal.style.display = 'none';
        }
      });
    }

    // Update mobile notice if needed
    if (UserInputManager && UserInputManager.isMobileDevice()) {
      const noteElement = document.getElementById('screenshot-note');
      if (noteElement) {
        noteElement.innerText = 'Please note: Using PC is recommended';
      }

      const yellowNotice = document.getElementById('screenshot-notice');
      if (yellowNotice) {
        yellowNotice.innerText = 'Please note: Using PC is recommended';
      }
    }
  }

  // Public API
  return {
    init,
    showAlert,
    toggleAcknowledgements
  };
})();