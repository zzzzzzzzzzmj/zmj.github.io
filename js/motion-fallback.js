/* Motion Fallback - Ensures content is visible even if anime.js fails to load */
(function() {
  'use strict';

  // Wait for DOM to be ready
  function ensureContentVisible() {
    console.log('[Motion Fallback] Checking content visibility...');

    // Check if anime.js is loaded
    if (typeof window.anime === 'undefined') {
      console.warn('[Motion Fallback] anime.js not loaded, forcing content visibility');
      forceShowContent();
      return;
    }

    // Set a timeout to check if motion has initialized (reduced to 1 second for faster response)
    setTimeout(function() {
      const postBlocks = document.querySelectorAll('.post-block');
      const header = document.querySelector('.header');
      const footer = document.querySelector('.footer');

      let needsFix = false;

      // Check post blocks
      postBlocks.forEach(function(el) {
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
          needsFix = true;
        }
      });

      // Check header
      if (header) {
        const headerStyle = window.getComputedStyle(header);
        if (parseFloat(headerStyle.opacity) < 0.1) {
          needsFix = true;
        }
      }

      // Check footer
      if (footer) {
        const footerStyle = window.getComputedStyle(footer);
        if (parseFloat(footerStyle.opacity) < 0.1) {
          needsFix = true;
        }
      }

      if (needsFix) {
        console.warn('[Motion Fallback] Animation did not complete, forcing content visibility');
        forceShowContent();
      } else {
        console.log('[Motion Fallback] Content is visible, no action needed');
      }
    }, 1000); // Reduced from 2000ms to 1000ms
  }

  function forceShowContent() {
    // Remove use-motion class to disable motion CSS
    document.body.classList.remove('use-motion');

    // Force show all post blocks
    const postBlocks = document.querySelectorAll('.post-block');
    postBlocks.forEach(function(el) {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });

    // Force show pagination
    const pagination = document.querySelector('.pagination');
    if (pagination) {
      pagination.style.visibility = 'visible';
      pagination.style.opacity = '1';
    }

    // Force show comments
    const comments = document.querySelector('.comments');
    if (comments) {
      comments.style.visibility = 'visible';
      comments.style.opacity = '1';
    }

    // Show header
    const header = document.querySelector('.header');
    if (header) {
      header.style.opacity = '1';
    }

    // Show footer
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.style.opacity = '1';
    }

    // Show all animated elements
    const animatedElements = document.querySelectorAll('.animated');
    animatedElements.forEach(function(el) {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });

    console.log('[Motion Fallback] Content forced to visible state');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureContentVisible);
  } else {
    ensureContentVisible();
  }
})();
