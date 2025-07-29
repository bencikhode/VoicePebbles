document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, starting injection');

  const mainNavPlaceholder = document.getElementById('navbar-placeholder');

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

      const toggleMenu = () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('nav-collapsed');

        // Toggle max-height for smooth transition
        if (nav.classList.contains('nav-collapsed')) {
          navList.style.display = 'flex'; // Make it visible (flex) before expanding
          navList.style.maxHeight = navList.scrollHeight + 'px'; // Set to actual scroll height
        } else {
          navList.style.maxHeight = '0'; // Collapse
          // Use setTimeout to allow the transition to complete before setting display: none
          setTimeout(() => {
            if (!nav.classList.contains('nav-collapsed')) { // Double check if still collapsed
              navList.style.display = 'none'; // Hide completely after collapsing
            }
          }, 300); // This duration should match your CSS transition duration
        }
        console.log('Navbar toggle clicked');
      };

      menuToggle.addEventListener('click', toggleMenu);

      // --- REMOVED: Dropdown handling logic for mobile ---
      // The following section is removed as you no longer want dropdowns
      /*
      const dropdownLinks = nav.querySelectorAll('.dropdown > a');
      dropdownLinks.forEach(dropdownLink => {
        dropdownLink.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            const dropdownMenu = dropdownLink.nextElementSibling;
            if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
              const isExpanded = dropdownLink.getAttribute('aria-expanded') === 'true';
              dropdownMenu.style.display = isExpanded ? 'none' : 'block';
              dropdownLink.setAttribute('aria-expanded', !isExpanded);
              console.log('Dropdown toggled');
            }
          }
        });
      });
      */

      // Handle resize to reset mobile state for desktop
      const handleResize = () => {
        if (window.innerWidth > 768) {
          // Reset main nav (remove mobile classes/styles)
          nav.classList.remove('nav-collapsed');
          navList.style.maxHeight = ''; // Remove max-height for desktop
          navList.style.display = ''; // Reset display for desktop (flex by default via CSS)

          // Reset menu toggle attributes
          menuToggle.setAttribute('aria-expanded', 'false');

          // --- REMOVED: Resetting dropdown menus (no longer applicable) ---
          /*
          nav.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = '';
          });
          nav.querySelectorAll('.dropdown > a').forEach(link => {
            link.setAttribute('aria-expanded', 'false');
          });
          */
        } else {
            // On mobile, if menu is not collapsed, ensure it's hidden
            if (!nav.classList.contains('nav-collapsed')) {
                navList.style.display = 'none';
            }
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