/* ==========================================================================
   Runax Institute of Hotel Management — Interactive Animations & Lenis Scroll
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
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

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollProgress) {
      scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', scrollTop > 16);
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
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // Safety fallback: ensure all elements become visible even if observer misses any
    setTimeout(() => {
      revealElements.forEach((el) => el.classList.add('is-visible'));
    }, 2200);
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  if (window.matchMedia('(pointer: fine)').matches) {
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
     6. Animated Number Counters ("Runax in numbers")
     ------------------------------------------------------------------------ */
  const numberElements = document.querySelectorAll('.number-value[data-count]');
  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
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
