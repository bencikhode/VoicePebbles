document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.features-carousel');
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
  let autoScrollInterval;

  if (carousel && prevButton && nextButton) {
    // Function to scroll to the next item
    const scrollNext = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (carousel.scrollLeft >= maxScroll) {
        // Reset to start when reaching the end
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: 280, behavior: 'smooth' });
      }
    };

    // Start auto-scrolling every 5 seconds
    const startAutoScroll = () => {
      autoScrollInterval = setInterval(scrollNext, 5000);
    };

    // Stop auto-scrolling
    const stopAutoScroll = () => {
      clearInterval(autoScrollInterval);
    };

    // Manual controls
    prevButton.addEventListener('click', () => {
      stopAutoScroll(); // Pause auto-scroll on manual interaction
      carousel.scrollBy({ left: -280, behavior: 'smooth' });
      startAutoScroll(); // Restart auto-scroll after interaction
    });

    nextButton.addEventListener('click', () => {
      stopAutoScroll(); // Pause auto-scroll on manual interaction
      scrollNext();
      startAutoScroll(); // Restart auto-scroll after interaction
    });

    // Pause auto-scroll on hover
    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    // Start auto-scrolling on page load
    startAutoScroll();
  }

  // Mobile-friendly dropdown menu
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const link = dropdown.querySelector('a');
    const menu = dropdown.querySelector('.dropdown-menu');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = link.getAttribute('aria-expanded') === 'true';
      link.setAttribute('aria-expanded', !isExpanded);
      menu.style.display = isExpanded ? 'none' : 'block';
    });
  });
});
