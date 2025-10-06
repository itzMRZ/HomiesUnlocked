/**
 * UIManager
 *
 * Handles UI interactions and effects:
 * - Shows and hides alerts
 * - Manages modals
 * - Handles acknowledgements section
 * - Detects Facebook/Messenger browser and shows warning modal
 */
const UIManager = (() => {  /**
   * Show a custom alert to the user (optimized)
   * @param {string} message - The message to display
   * @param {string} type - Alert type ('error', 'success', 'info')
   */
  function showAlert(message, type = 'error') {
    // Remove any existing alert
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // Determine alert color based on type
    let bgColor = 'bg-red-500'; // default error
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'info') bgColor = 'bg-blue-500';

    // Create new alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    alertDiv.style.opacity = '0';
    alertDiv.style.transition = 'opacity 0.3s ease';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    // Immediate fade in
    requestAnimationFrame(() => {
      alertDiv.style.opacity = '1';
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.remove();
        }
      }, 300);
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
   * Detect if user is using Facebook or Messenger in-app browser
   * @returns {boolean} True if Facebook/Messenger browser is detected
   */
  function isFacebookBrowser() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check for Facebook in-app browser indicators
    const facebookIndicators = [
      'FBAN', 'FBAV', 'FBSV', 'FBDV', 'FBMD', 'FBSN', 'FBBK', 'FBCA',
      'MessengerForiOS', 'MessengerLite', 'MessengerBrowser',
      'Instagram', 'WhatsApp'
    ];

    return facebookIndicators.some(indicator => userAgent.includes(indicator));
  }

  /**
   * Initialize Facebook browser modal functionality
   */
  function initFacebookBrowserModal() {
    if (!isFacebookBrowser()) return;

    const modal = document.getElementById('facebook-browser-modal');
    const closeBtn = document.getElementById('facebook-modal-close');
    const copyBtn = document.getElementById('copy-link-btn');
    const continueBtn = document.getElementById('continue-anyway');
    const copyAndDismissBtn = document.getElementById('copy-and-dismiss');
    const linkText = document.getElementById('copy-link');

    if (!modal) return;

    // Show modal immediately
    modal.style.display = 'flex';    // Copy link functionality
    function copyLink() {
      const link = 'https://homies-unlocked.itzmrz.xyz/';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          showAlert('Link copied to clipboard!', 'success');
          if (copyBtn) {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          }
        }).catch(() => {
          fallbackCopyText(link);
        });
      } else {
        fallbackCopyText(link);
      }
    }

    // Fallback copy method
    function fallbackCopyText(text) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          showAlert('Link copied to clipboard!', 'success');
          if (copyBtn) {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          }
        } else {
          showAlert('Please manually copy the link above', 'info');
        }
      } catch (err) {
        console.warn('Copy failed:', err);
        showAlert('Please manually copy the link above', 'info');
      }
    }

    // Close modal
    function closeModal() {
      modal.style.display = 'none';
    }

    // Event listeners
    closeBtn?.addEventListener('click', closeModal);
    copyBtn?.addEventListener('click', copyLink);
    continueBtn?.addEventListener('click', closeModal);
    copyAndDismissBtn?.addEventListener('click', () => {
      copyLink();
      setTimeout(closeModal, 500); // Small delay to show copy feedback
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Also allow clicking on the link text to copy
    linkText?.addEventListener('click', copyLink);
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
    }    // Update mobile notice if needed
    if (typeof UserInputManager !== 'undefined' && UserInputManager.isMobileDevice()) {
      const yellowNotice = document.getElementById('screenshot-notice');
      if (yellowNotice) {
        yellowNotice.textContent = 'Generate a combined routine with up to 10 people ^_~';
      }
    }

    initFacebookBrowserModal();
  }
  // Public API
  return {
    init,
    showAlert,
    toggleAcknowledgements,
    isFacebookBrowser,
    initFacebookBrowserModal
  };
})();