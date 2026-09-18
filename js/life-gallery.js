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

  const createDisclosure = (level, label, contentId) => {
    const heading = createElement(level === 'year' ? 'h2' : 'h3', `life-${level}-title`);
    const button = createElement('button', `life-group-toggle life-${level}-toggle`);
    const buttonText = createElement('span', 'life-group-toggle-text', label);
    const icon = createElement('i', 'fas fa-chevron-down life-group-toggle-icon');
    button.type = 'button';
    button.setAttribute('aria-controls', contentId);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', `收起${label}`);
    icon.setAttribute('aria-hidden', 'true');
    button.append(buttonText, icon);
    heading.appendChild(button);
    return { button, heading };
  };

  const connectDisclosure = (button, content, section, label) => {
    button.addEventListener('click', () => {
      const willExpand = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(willExpand));
      button.setAttribute('aria-label', `${willExpand ? '收起' : '展开'}${label}`);
      content.setAttribute('aria-hidden', String(!willExpand));
      content.classList.toggle('is-collapsed', !willExpand);
      section.classList.toggle('is-collapsed', !willExpand);
      content.inert = !willExpand;
    });
  };

  const createCollapsible = className => {
    const content = createElement('div', `life-group-collapse ${className}`);
    const inner = createElement('div', 'life-group-inner');
    content.appendChild(inner);
    return { content, inner };
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
    const layout = createElement('div', 'life-entry-layout');
    const info = createElement('header', 'life-entry-info');
    const photos = createElement('div', 'life-entry-photos');
    const dateLabel = `${item.date.month}.${item.date.day}`;
    info.appendChild(createElement('h4', 'life-entry-date', dateLabel));

    if (item.location) {
      const location = createElement('div', 'life-entry-location');
      const locationIcon = createElement('i', 'fas fa-map-marker-alt');
      locationIcon.setAttribute('aria-hidden', 'true');
      location.append(locationIcon, document.createTextNode(item.location));
      info.appendChild(location);
    }

    if (item.text) info.appendChild(createElement('p', 'life-entry-text', item.text));

    if (item.photos.length) {
      const photoGrid = createElement('div', 'life-photo-grid');
      photoGrid.dataset.count = String(item.photos.length);
      item.photos.forEach((photo, index) => photoGrid.appendChild(createPhoto(photo, item.photos, index)));
      photos.appendChild(photoGrid);
    } else {
      layout.classList.add('has-no-photos');
    }

    layout.append(info, photos);
    article.appendChild(layout);
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
      const yearContentId = `life-year-content-${year}`;
      const yearDisclosure = createDisclosure('year', year, yearContentId);
      const yearCollapsible = createCollapsible('life-year-content');
      yearCollapsible.content.id = yearContentId;

      months.forEach((monthEntries, month) => {
        const monthSection = createElement('section', 'life-month-group');
        const monthLabel = monthEntries[0].date.monthName;
        const monthContentId = `life-month-content-${year}-${month}`;
        const monthDisclosure = createDisclosure('month', monthLabel, monthContentId);
        const monthCollapsible = createCollapsible('life-month-content');
        monthCollapsible.content.id = monthContentId;
        monthEntries.forEach(entry => monthCollapsible.inner.appendChild(createEntry(entry)));
        monthSection.append(monthDisclosure.heading, monthCollapsible.content);
        connectDisclosure(monthDisclosure.button, monthCollapsible.content, monthSection, monthLabel);
        yearCollapsible.inner.appendChild(monthSection);
      });

      yearSection.append(yearDisclosure.heading, yearCollapsible.content);
      connectDisclosure(yearDisclosure.button, yearCollapsible.content, yearSection, year);
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
