(() => {
  const logRoot = document.querySelector('#life-log');
  const lightbox = document.querySelector('#life-lightbox');

  if (!logRoot || !lightbox) return;

  const entries = Array.isArray(window.LIFE_ENTRIES) ? [...window.LIFE_ENTRIES] : [];
  const closeButton = lightbox.querySelector('.life-lightbox-close');
  const previousButton = lightbox.querySelector('.life-lightbox-prev');
  const nextButton = lightbox.querySelector('.life-lightbox-next');
  const lightboxImage = lightbox.querySelector('.life-lightbox-image');
  const lightboxCaption = lightbox.querySelector('.life-lightbox-caption');
  const monthNames = new Intl.DateTimeFormat('en-US', { month: 'long' });
  let activePhotos = [];
  let activePhotoIndex = 0;
  let lastTrigger = null;
  let entrySequence = 0;

  const parseDate = dateValue => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '');
    if (!match) return null;
    const [, year, month, day] = match;
    return {
      day,
      key: `${year}-${month}-${day}`,
      month,
      monthName: monthNames.format(new Date(Number(year), Number(month) - 1, 1)),
      year
    };
  };

  const createElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const updateLightbox = () => {
    const photo = activePhotos[activePhotoIndex];
    if (!photo) return;
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt || photo.caption || '生活照片大图';
    lightboxCaption.textContent = photo.caption || '';
    lightboxCaption.hidden = !photo.caption;
    const hasMultiplePhotos = activePhotos.length > 1;
    previousButton.classList.toggle('is-hidden', !hasMultiplePhotos);
    nextButton.classList.toggle('is-hidden', !hasMultiplePhotos);
    previousButton.disabled = !hasMultiplePhotos;
    nextButton.disabled = !hasMultiplePhotos;
  };

  const openLightbox = (photos, index, trigger) => {
    activePhotos = photos;
    activePhotoIndex = index;
    lastTrigger = trigger;
    updateLightbox();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('life-lightbox-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('life-lightbox-open');
    lightboxImage.removeAttribute('src');
    if (lastTrigger) lastTrigger.focus();
  };

  const moveLightbox = step => {
    activePhotoIndex = (activePhotoIndex + step + activePhotos.length) % activePhotos.length;
    updateLightbox();
  };

  const createPhoto = (photo, photos, index) => {
    const figure = createElement('figure', 'life-photo');
    const button = createElement('button', 'life-photo-button');
    const image = document.createElement('img');
    button.type = 'button';
    button.setAttribute('aria-label', `查看第 ${index + 1} 张照片大图`);
    image.src = photo.thumb || photo.src;
    image.alt = photo.alt || photo.caption || '生活照片';
    image.loading = 'lazy';
    image.decoding = 'async';
    button.appendChild(image);
    button.addEventListener('click', () => openLightbox(photos, index, button));
    figure.appendChild(button);
    if (photo.caption) figure.appendChild(createElement('figcaption', 'life-photo-caption', photo.caption));
    return figure;
  };

  const createEntry = item => {
    const article = createElement('article', 'life-entry');
    const meta = createElement('header', 'life-entry-meta');
    const content = createElement('div', 'life-entry-content');
    const toggle = createElement('button', 'life-entry-toggle');
    const dateLabel = `${item.date.month}.${item.date.day}`;
    const contentId = `life-entry-content-${item.date.key}-${entrySequence += 1}`;
    const date = createElement('span', 'life-entry-date', dateLabel);
    const toggleIcon = createElement('i', 'fas fa-chevron-down life-entry-toggle-icon');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', contentId);
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', `收起 ${dateLabel} 的生活记录`);
    toggleIcon.setAttribute('aria-hidden', 'true');
    toggle.append(date, toggleIcon);
    meta.appendChild(toggle);

    content.id = contentId;

    if (item.location) {
      const location = createElement('div', 'life-entry-location');
      const locationIcon = createElement('i', 'fas fa-map-marker-alt');
      locationIcon.setAttribute('aria-hidden', 'true');
      location.append(locationIcon, document.createTextNode(item.location));
      meta.appendChild(location);
    }

    article.append(meta, content);

    const layout = createElement('div', 'life-entry-layout');
    const showSideNote = item.text && item.notePosition === 'side' && item.photos.length;
    if (showSideNote) layout.classList.add('has-side-note');

    if (item.photos.length) {
      const photoGrid = createElement('div', 'life-photo-grid');
      photoGrid.dataset.count = String(item.photos.length);
      item.photos.forEach((photo, index) => photoGrid.appendChild(createPhoto(photo, item.photos, index)));
      layout.appendChild(photoGrid);
    }

    if (showSideNote) {
      const note = createElement('aside', 'life-entry-note');
      note.setAttribute('aria-label', `${dateLabel} 记录说明`);
      note.appendChild(createElement('p', 'life-entry-text', item.text));
      layout.appendChild(note);
    }

    if (layout.childElementCount) content.appendChild(layout);
    if (item.text && !showSideNote) content.appendChild(createElement('p', 'life-entry-text', item.text));

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      toggle.setAttribute('aria-label', `${isExpanded ? '展开' : '收起'} ${dateLabel} 的生活记录`);
      content.hidden = isExpanded;
      article.classList.toggle('is-collapsed', isExpanded);
    });

    return article;
  };

  const normalizedEntries = entries
    .map(entry => ({
      ...entry,
      date: parseDate(entry.date),
      photos: Array.isArray(entry.photos) ? entry.photos.filter(photo => photo && photo.src) : []
    }))
    .filter(entry => entry.date)
    .sort((a, b) => b.date.key.localeCompare(a.date.key));

  if (!normalizedEntries.length) {
    logRoot.appendChild(createElement('p', 'life-empty', '生活影像正在整理中。'));
  } else {
    const years = new Map();
    normalizedEntries.forEach(entry => {
      if (!years.has(entry.date.year)) years.set(entry.date.year, new Map());
      const months = years.get(entry.date.year);
      if (!months.has(entry.date.month)) months.set(entry.date.month, []);
      months.get(entry.date.month).push(entry);
    });

    years.forEach((months, year) => {
      const yearSection = createElement('section', 'life-year-group');
      yearSection.appendChild(createElement('h2', 'life-year-title', year));
      months.forEach(monthEntries => {
        const monthSection = createElement('section', 'life-month-group');
        monthSection.appendChild(createElement('h3', 'life-month-title', monthEntries[0].date.monthName));
        monthEntries.forEach(entry => monthSection.appendChild(createEntry(entry)));
        yearSection.appendChild(monthSection);
      });
      logRoot.appendChild(yearSection);
    });
  }

  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => moveLightbox(-1));
  nextButton.addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft' && activePhotos.length > 1) moveLightbox(-1);
    if (event.key === 'ArrowRight' && activePhotos.length > 1) moveLightbox(1);
  });
})();
