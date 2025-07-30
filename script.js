document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, starting injection');

  const mainNavPlaceholder = document.getElementById('navbar-placeholder');
  const siteHeader = document.querySelector('.site-header'); // Get the main header element

  const injectPartials = async () => {
    try {
      // Inject Navbar
      if (mainNavPlaceholder) {
        const navbarResponse = await fetch('header.html');
        if (!navbarResponse.ok) throw new Error(`HTTP error! status: ${navbarResponse.status}`);
        const navbarHTML = await navbarResponse.text();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = navbarHTML;
        const navElement = tempDiv.querySelector('.main-nav');

        if (navElement) {
          mainNavPlaceholder.appendChild(navElement);
          console.log('Navbar injected successfully:', navElement);
          initializeMobileMenu(navElement); // Initialize mobile menu functionality AFTER navbar is in place
        } else {
          console.error('No .main-nav element found in header.html');
        }
      } else {
        console.error('Navbar placeholder element not found');
      }

      // Inject Footer
      const footerResponse = await fetch('footer.html');
      if (!footerResponse.ok) throw new Error(`HTTP error! status: ${footerResponse.status}`);
      const footerHTML = await footerResponse.text();

      const parser = new DOMParser();
      const footerDoc = parser.parseFromString(footerHTML, 'text/html');
      const footerElement = footerDoc.querySelector('footer');

      if (footerElement) {
        document.body.appendChild(footerElement);
        console.log('Footer injected successfully');
      } else {
        console.error('No <footer> element found in footer.html');
      }
    } catch (error) {
      console.error('Error in injection process:', error);
    }
  };

  const initializeMobileMenu = (nav) => {
    const menuToggle = nav.querySelector('.menu-toggle');
    const navList = nav.querySelector('ul');

    if (menuToggle && navList) {
      console.log('Menu toggle and nav list found within injected navbar for mobile functionality.');

      const closeMenu = () => {
        if (nav.classList.contains('nav-collapsed')) { // Only close if it's open
            menuToggle.setAttribute('aria-expanded', 'false');
            nav.classList.remove('nav-collapsed');
            navList.style.maxHeight = '0'; // Collapse
            setTimeout(() => {
                navList.style.display = 'none'; // Hide completely after collapsing
            }, 300); // Match CSS transition duration
            console.log('Navbar closed');
        }
      };

      const openMenu = () => {
        menuToggle.setAttribute('aria-expanded', 'true');
        nav.classList.add('nav-collapsed');

        // Dynamically set top position based on header height
        // Get the current computed height of the site-header
        const headerHeight = siteHeader.offsetHeight;
        navList.style.top = headerHeight + 'px';

        navList.style.display = 'flex'; // Make it visible (flex) before expanding
        navList.style.maxHeight = navList.scrollHeight + 'px'; // Set to actual scroll height
        console.log('Navbar opened');
      };

      const toggleMenu = () => {
        if (nav.classList.contains('nav-collapsed')) {
          closeMenu();
        } else {
          openMenu();
        }
      };

      menuToggle.addEventListener('click', toggleMenu);

      // NEW: Close menu when clicking outside
      document.addEventListener('click', (event) => {
        // Check if the click is outside the main navigation area and the menu is open
        const isClickInsideNav = nav.contains(event.target);
        const isMenuOpen = nav.classList.contains('nav-collapsed');

        if (!isClickInsideNav && isMenuOpen) {
          closeMenu();
        }
      });


      // Handle resize to reset mobile state for desktop
      const handleResize = () => {
        if (window.innerWidth > 768) {
          // Reset main nav (remove mobile classes/styles)
          nav.classList.remove('nav-collapsed');
          navList.style.maxHeight = ''; // Remove max-height for desktop
          navList.style.display = ''; // Reset display for desktop (flex by default via CSS)
          navList.style.top = ''; // Remove dynamic top for desktop

          // Reset menu toggle attributes
          menuToggle.setAttribute('aria-expanded', 'false');
        } else {
            // On mobile, if menu is not collapsed, ensure it's hidden
            if (!nav.classList.contains('nav-collapsed')) {
                navList.style.display = 'none';
            }
            // Also, ensure the top position is correct if the menu is open or about to open
            const headerHeight = siteHeader.offsetHeight;
            navList.style.top = headerHeight + 'px';
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call to set correct state on page load/refresh
    } else {
      console.error('Menu toggle or nav list not found within the injected navbar for initialization.');
    }
  };

  // Carousel functionality (your existing code, no changes needed)
  const carousel = document.querySelector('.features-carousel');
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
  let autoScrollInterval;

  if (carousel && prevButton && nextButton) {
    const scrollNext = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (carousel.scrollLeft >= maxScroll) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: 280, behavior: 'smooth' });
      }
    };

    const startAutoScroll = () => {
      autoScrollInterval = setInterval(scrollNext, 5000);
    };

    const stopAutoScroll = () => {
      clearInterval(autoScrollInterval);
    };

    prevButton.addEventListener('click', () => {
      stopAutoScroll();
      carousel.scrollBy({ left: -280, behavior: 'smooth' });
      startAutoScroll();
    });

    nextButton.addEventListener('click', () => {
      stopAutoScroll();
      scrollNext();
      startAutoScroll();
    });

    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    startAutoScroll();
  }

  // Execute injection
  injectPartials();
});
