document.addEventListener('DOMContentLoaded', () => {
  const progressItems = document.querySelectorAll('.progress-item');
  const progressLineFill = document.querySelector('.progress-line-fill');
  const progressTrack = document.querySelector('.progress-track');

  const sections = [];
  progressItems.forEach(item => {
    const id = item.dataset.section;
    let el;
    if (id === 'hero') {
      el = document.querySelector('.hero-flow');
    } else {
      el = document.getElementById(id);
    }
    if (el) {
      sections.push({ id, el });
    }
  });

  const updateProgress = () => {
    if (sections.length === 0) return;

    const viewportHeight = window.innerHeight;
    const activationThreshold = viewportHeight * 0.35;

    let activeIdx = 0;
    for (let idx = 0; idx < sections.length; idx++) {
      const rect = sections[idx].el.getBoundingClientRect();
      if (rect.top <= activationThreshold) {
        activeIdx = idx;
      } else {
        break;
      }
    }

    if (progressLineFill && progressTrack) {
      const trackHeight = progressTrack.offsetHeight;
      const maxFillHeight = trackHeight - 44; 
      const fillHeight = (activeIdx / Math.max(sections.length - 1, 1)) * maxFillHeight;
      progressLineFill.style.height = `${Math.min(Math.max(fillHeight, 0), maxFillHeight)}px`;
    }

    progressItems.forEach(item => {
      const sectionId = item.dataset.section;
      const sectionIdx = sections.findIndex(s => s.id === sectionId);

      item.classList.remove('active', 'passed');
      if (sectionIdx === activeIdx) {
        item.classList.add('active');
      } else if (sectionIdx >= 0 && sectionIdx < activeIdx) {
        item.classList.add('passed');
      }
    });
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
});

document.addEventListener('DOMContentLoaded', () => {
  const domainBtns = document.querySelectorAll('.domain-btn');
  const domainContents = document.querySelectorAll('.domain-content');

  domainBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      domainBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      domainContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tab}-content`).classList.add('active');
    });
  });

  const carouselNavs = document.querySelectorAll('.carousel-nav');

  carouselNavs.forEach(nav => {
    nav.addEventListener('click', () => {
      const carouselId = nav.dataset.carousel;
      const carousel = document.getElementById(`carousel-${carouselId}`);
      const items = carousel.querySelectorAll('.carousel-item');
      let currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));

      items[currentIndex].classList.remove('active');

      if (nav.classList.contains('prev')) {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
      } else {
        currentIndex = (currentIndex + 1) % items.length;
      }

      items[currentIndex].classList.add('active');

      items.forEach((item, idx) => {
        const videos = item.querySelectorAll('video');
        videos.forEach(video => {
          if (idx === currentIndex) {
            video.play();
          } else {
            video.pause();
          }
        });
      });
    });
  });

  const copyBtn = document.getElementById('copyBibtex');
  if (copyBtn) {
    const copyToClipboard = (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts
        return new Promise((resolve, reject) => {
          try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) resolve();
            else reject(new Error('Fallback copy failed'));
          } catch (err) {
            reject(err);
          }
        });
      }
    };

    copyBtn.addEventListener('click', () => {
      const bibtexCode = document.getElementById('bibtexCode').textContent.trim();
      copyToClipboard(bibtexCode).then(() => {
        const span = copyBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
          span.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }

  const highlightCards = document.querySelectorAll('.highlight-card');
  highlightCards.forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.dataset.tab;
      if (tab) {
        const btn = document.querySelector(`.domain-btn[data-tab="${tab}"]`);
        if (btn) {
          btn.click();
          document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
