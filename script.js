/* ==========================================================================
   Runax Institute of Hotel Management — Interactive Animations & Lenis Scroll
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ------------------------------------------------------------------------
     0. Intro Loader → Hero Choreography
     ------------------------------------------------------------------------ */
  const introLoader = document.getElementById('introLoader');
  const playHero = () => requestAnimationFrame(() => root.classList.add('hero-in'));
  const loaderSkipped = !introLoader || prefersReducedMotion || root.classList.contains('no-loader');

  if (loaderSkipped) {
    introLoader?.remove();
    playHero();
  } else {
    root.style.overflow = 'hidden';
    requestAnimationFrame(() => introLoader.classList.add('ready'));
    const dismissLoader = () => {
      introLoader.classList.add('done');
      root.style.removeProperty('overflow');
      try { sessionStorage.setItem('runaxIntroSeen', '1'); } catch (e) { /* storage blocked */ }
      setTimeout(playHero, 250);
      setTimeout(() => introLoader.remove(), 1000);
    };
    // Minimum ~1.2s so the progress line completes; never wait longer than 3s
    const minTime = new Promise((r) => setTimeout(r, 1200));
    const loaded = new Promise((r) => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    Promise.race([Promise.all([minTime, loaded]), new Promise((r) => setTimeout(r, 3000))]).then(dismissLoader);
  }

  /* ------------------------------------------------------------------------
     1. Lenis Smooth Scrolling (non-blocking, works on http & file://)
     ------------------------------------------------------------------------ */
  let lenis = null;
  if (window.location.protocol.startsWith('http')) {
    import('https://cdn.jsdelivr.net/npm/lenis@1.1.18/+esm')
      .then(({ default: Lenis }) => {
        lenis = new Lenis({
          smoothWheel: true,
          duration: 1.15,
        });
        const raf = (time) => {
          lenis.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      })
      .catch((err) => {
        console.warn('Lenis fallback to native scroll:', err);
      });
  }

  /* ------------------------------------------------------------------------
     2. Scroll Progress, Hero Parallax, Sticky Header & Mobile CTA Bar
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scrollProgress');
  const siteHeader = document.getElementById('siteHeader');
  const floatingTopBtn = document.getElementById('floatingTopBtn');
  const heroSection = document.querySelector('.hero-section');
  const heroBgImage = document.querySelector('.hero-bg-image');
  const heroFormCard = document.getElementById('hero-form');
  const mobileCtaBar = document.getElementById('mobileCtaBar');

  let lastScrollTop = window.scrollY;
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;

    if (scrollProgress) {
      scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    }

    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', scrollTop > 16);
      // Hide while reading downward, return as soon as the user scrolls up
      const delta = scrollTop - lastScrollTop;
      const drawerOpen = document.getElementById('menuToggle')?.getAttribute('aria-expanded') === 'true';
      if (scrollTop < 240 || drawerOpen) {
        siteHeader.classList.remove('nav-hidden');
      } else if (Math.abs(delta) > 6) {
        siteHeader.classList.toggle('nav-hidden', delta > 0);
      }
      lastScrollTop = scrollTop;
    }

    if (floatingTopBtn) {
      floatingTopBtn.classList.toggle('visible', scrollTop > 480);
    }

    if (heroBgImage && heroSection) {
      const rect = heroSection.getBoundingClientRect();
      const heroProgress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
      heroBgImage.style.transform = `translate3d(0, ${heroProgress * 12}%, 0) scale(${1 + heroProgress * 0.05})`;
    }

    if (mobileCtaBar && heroFormCard) {
      const formBottom = heroFormCard.getBoundingClientRect().bottom;
      mobileCtaBar.classList.toggle('show', formBottom < 0);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (floatingTopBtn) {
    floatingTopBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.1 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* Smooth Anchor Links via Lenis */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -74, duration: 1.15 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  /* ------------------------------------------------------------------------
     4. Mobile Navigation Drawer
     ------------------------------------------------------------------------ */
  const menuToggle = document.getElementById('menuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  const closeDrawer = () => {
    if (!menuToggle || !mobileDrawer) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileDrawer.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
  };

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      mobileDrawer.classList.toggle('open', !isOpen);
      mobileDrawer.setAttribute('aria-hidden', String(isOpen));
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  /* ------------------------------------------------------------------------
     5. Staggered Scroll-Reveal Observer & Interactive 3D Card Tilt
     ------------------------------------------------------------------------ */
  const revealElements = document.querySelectorAll('.reveal');

  // After an element has revealed, drop the reveal class so its own hover
  // transitions (shadow, border, tilt) run without the entrance delay.
  const finishReveal = (el) => {
    const delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
    setTimeout(() => el.classList.remove('reveal'), delay * 1000 + 1200);
  };

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    root.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            finishReveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // Cursor spotlight: a soft gold glow tracks the mouse inside each card
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.program-card, .why-card, .testimonial-card, .number-item').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }

  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    document.querySelectorAll('.interactive-tilt, .why-card, .testimonial-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------------
     5b. Hero Banner Slideshow (cross-fade + slow zoom, pauses on hover/tab hide)
     ------------------------------------------------------------------------ */
  const heroSlides = [...document.querySelectorAll('.hero-slide')];
  const SLIDE_MS = 6000;
  let slideIndex = 0;
  let slideTimer = null;

  const showSlide = (next) => {
    slideIndex = (next + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((s, i) => s.classList.toggle('is-active', i === slideIndex));
  };

  const startSlides = () => {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => showSlide(slideIndex + 1), SLIDE_MS);
  };

  if (heroSlides.length > 1 && !prefersReducedMotion) {
    startSlides();
    document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(slideTimer) : startSlides()));
  }

  /* ------------------------------------------------------------------------
     5c. Custom Cursor — dot + lagging ring, reacts to links and gallery photos
     ------------------------------------------------------------------------ */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const cursorLabel = document.querySelector('.cursor-label');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    root.classList.add('has-cursor');
    let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }, { passive: true });

    const followRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(followRing);
    };
    requestAnimationFrame(followRing);

    const setState = (cls, on) => {
      cursorDot.classList.toggle(cls, on);
      cursorRing.classList.toggle(cls, on);
    };

    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('.gallery-card');
      const field = e.target.closest('input, textarea');
      const link = e.target.closest('a, button, select, label, [role="button"]');
      setState('is-view', !!view);
      if (cursorLabel) cursorLabel.textContent = view ? 'View' : '';
      setState('is-hover', !view && !!link);
      setState('is-hidden', !!field);
    });

    document.addEventListener('mousedown', () => cursorRing.classList.add('is-down'));
    document.addEventListener('mouseup', () => cursorRing.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => setState('is-hidden', true));
    document.documentElement.addEventListener('mouseenter', () => setState('is-hidden', false));
  }

  /* ------------------------------------------------------------------------
     6. Animated Number Counters ("Runax in numbers")
     ------------------------------------------------------------------------ */
  const numberElements = document.querySelectorAll('.number-value[data-count]');
  const animateCounter = (el, index = 0) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 2200;
    // Start each counter in step with its card's staggered entrance
    setTimeout(() => {
      const startTime = performance.now();
      el.classList.add('counting');
      const tick = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out expo: fast roll, gentle settle
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          el.classList.remove('counting');
          el.classList.add('counted');
        }
      };
      requestAnimationFrame(tick);
    }, 150 + index * 120);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, [...numberElements].indexOf(entry.target));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  numberElements.forEach((el) => counterObserver.observe(el));

  /* ------------------------------------------------------------------------
     7. Toast Helper & Enquiry Forms
     ------------------------------------------------------------------------ */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  };

  const handleFormSubmit = (form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach((field) => {
        const value = field.value.trim();
        const emailInvalid = field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!value || emailInvalid) {
          field.classList.add('error');
          isValid = false;
        } else {
          field.classList.remove('error');
        }
      });

      if (!isValid) {
        showToast('Please fill in all required fields with valid details.');
        return;
      }

      const data = new FormData(form);
      const name = data.get('fullName') || '';
      const email = data.get('email') || '';
      const phone = data.get('phone') || '';
      const city = data.get('city') || 'Not specified';
      const program = data.get('program') || 'General Enquiry';
      const interest = data.get('interest') || '';
      const query = data.get('query') || 'No additional message.';

      const subject = encodeURIComponent(`Admissions Enquiry 2027–28: ${program} - ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCity: ${city}\nProgram: ${program}` +
          (interest ? `\nStudy Interest: ${interest}` : '') +
          `\n\nQuery:\n${query}`
      );

      showToast('Enquiry prepared! Opening your email app…');
      window.location.href = `mailto:admission@runaxinstitute.com?subject=${subject}&body=${body}`;
    });

    form.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  };

  const heroForm = document.getElementById('heroEnquiryForm');
  const footerForm = document.getElementById('footerEnquiryForm');
  if (heroForm) handleFormSubmit(heroForm);
  if (footerForm) handleFormSubmit(footerForm);

  document.querySelectorAll('[data-select-program]').forEach((link) => {
    link.addEventListener('click', () => {
      const targetProgram = link.getAttribute('data-select-program');
      const heroSelect = document.getElementById('heroProgram');
      if (heroSelect && targetProgram) {
        heroSelect.value = targetProgram;
      }
    });
  });

  /* ------------------------------------------------------------------------
     8. Gallery Lightbox Modal
     ------------------------------------------------------------------------ */
  const galleryItems = [
    { src: 'assets/runax/food-lab.webp', title: 'Food Production Lab' },
    { src: 'assets/runax/front-office.webp', title: 'Front Office' },
    { src: 'assets/runax/classroom.webp', title: 'Classroom' },
    { src: 'assets/runax/housekeeping.webp', title: 'Housekeeping Lab' },
    { src: 'assets/runax/food-beverage.webp', title: 'Food & Beverage Lab' },
    { src: 'assets/runax/campus.webp', title: 'Runax Campus' },
  ];

  const galleryModal = document.getElementById('galleryModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  let activeGalleryIndex = 0;

  const renderLightbox = (index) => {
    activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeGalleryIndex];
    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = item.title;
    }
  };

  const openLightbox = (index) => {
    renderLightbox(index);
    if (galleryModal) {
      galleryModal.classList.add('open');
      galleryModal.setAttribute('aria-hidden', 'false');
      lenis?.stop();
    }
  };

  const closeLightbox = () => {
    if (galleryModal) {
      galleryModal.classList.remove('open');
      galleryModal.setAttribute('aria-hidden', 'true');
      lenis?.start();
    }
  };

  document.querySelectorAll('.gallery-card[data-index]').forEach((card) => {
    card.addEventListener('click', () => {
      openLightbox(Number(card.dataset.index || 0));
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => renderLightbox(activeGalleryIndex - 1));
  lightboxNext?.addEventListener('click', () => renderLightbox(activeGalleryIndex + 1));
  galleryModal?.addEventListener('click', (e) => {
    if (e.target === galleryModal) closeLightbox();
  });

  /* ------------------------------------------------------------------------
     9. Course Details Modal (Strictly 3 Core Programs)
     ------------------------------------------------------------------------ */
  const courseData = {
    hotel: {
      tag: 'HOTEL OPERATIONS',
      title: 'Hotel Management',
      desc: 'Explore the business of luxury hotels, from guest experiences to day-to-day hotel operations, front office systems, and global leadership.',
      modules: [
        'Front Office Operations & PMS Software',
        'Food & Beverage Service & Bar Management',
        'Accommodation & Housekeeping Standards',
        'Hotel Revenue, Marketing & Internship Placement',
      ],
    },
    hospitality: {
      tag: 'HOSPITALITY',
      title: 'Hospitality Management',
      desc: 'Master service excellence, guest relations, and international hospitality leadership across luxury resorts, airlines, and cruise lines.',
      modules: [
        'Guest Relations, Grooming & Concierge Excellence',
        'Resort, Event & Tourism Operations',
        'Global Hospitality Communication & Etiquette',
        'International Industrial Training & Placement',
      ],
    },
    culinary: {
      tag: 'CULINARY',
      title: 'Culinary Management',
      desc: 'Master classical and contemporary culinary techniques in our stainless-steel Food Production Labs under experienced mentor chefs.',
      modules: [
        'Knife Skills, Stocks & Continental Cuisine',
        'Indian Regional & Tandoor Gastronomy',
        'Bakery, Pastry & Confectionery Arts',
        'Kitchen Hygiene, Costing & Menu Engineering',
      ],
    },
  };

  const courseModal = document.getElementById('courseModal');
  const courseModalTag = document.getElementById('courseModalTag');
  const courseModalTitle = document.getElementById('courseModalTitle');
  const courseModalDesc = document.getElementById('courseModalDesc');
  const courseModalList = document.getElementById('courseModalList');
  const courseModalClose = document.getElementById('courseModalClose');
  const courseModalApply = document.getElementById('courseModalApply');
  let selectedCourseTitle = '';

  const closeCourseModal = () => {
    if (courseModal) {
      courseModal.classList.remove('open');
      courseModal.setAttribute('aria-hidden', 'true');
      lenis?.start();
    }
  };

  document.querySelectorAll('.explore-course-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const info = courseData[btn.dataset.course];
      if (!info || !courseModal) return;
      selectedCourseTitle = info.title;
      courseModalTag.textContent = info.tag;
      courseModalTitle.textContent = info.title;
      courseModalDesc.textContent = info.desc;
      courseModalList.innerHTML = info.modules.map((m) => `<li>${m}</li>`).join('');
      courseModal.classList.add('open');
      courseModal.setAttribute('aria-hidden', 'false');
      lenis?.stop();
    });
  });

  courseModalClose?.addEventListener('click', closeCourseModal);
  courseModal?.addEventListener('click', (e) => {
    if (e.target === courseModal) closeCourseModal();
  });

  courseModalApply?.addEventListener('click', () => {
    closeCourseModal();
    const heroSelect = document.getElementById('heroProgram');
    if (heroSelect && selectedCourseTitle) {
      heroSelect.value = selectedCourseTitle;
    }
    if (lenis && heroFormCard) {
      lenis.scrollTo(heroFormCard, { offset: -90, duration: 1.1 });
    } else {
      heroFormCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeCourseModal();
      closeDrawer();
    }
  });
});
