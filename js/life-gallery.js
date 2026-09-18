(() => {
  const logRoot = document.querySelector('#life-log');
  const lightbox = document.querySelector('#life-lightbox');

  if (!logRoot || !lightbox) return;

  const monthRecords = Array.isArray(window.LIFE_MONTHS) ? [...window.LIFE_MONTHS] : [];
  const closeButton = lightbox.querySelector('.life-lightbox-close');
  const previousButton = lightbox.querySelector('.life-lightbox-prev');
  const nextButton = lightbox.querySelector('.life-lightbox-next');
  const lightboxImage = lightbox.querySelector('.life-lightbox-image');
  const lightboxCaption = lightbox.querySelector('.life-lightbox-caption');
  const monthNames = new Intl.DateTimeFormat('zh-CN', { month: 'long' });
  let activePhotos = [];
  let activePhotoIndex = 0;
  let lastTrigger = null;

  const parseMonth = monthValue => {
    const match = /^(\d{4})-(\d{2})$/.exec(monthValue || '');
    if (!match) return null;
    const [, year, month] = match;
    return {
      key: `${year}-${month}`,
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

  const createDisclosure = (level, label, contentId, photoCount = 0) => {
    const heading = createElement(level === 'year' ? 'h2' : 'h3', `life-${level}-title`);
    const button = createElement('button', `life-group-toggle life-${level}-toggle`);
    const buttonText = createElement('span', 'life-group-toggle-text', label);
    const icon = createElement('i', 'fas fa-chevron-down life-group-toggle-icon');
    button.type = 'button';
    button.setAttribute('aria-controls', contentId);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', `收起${label}`);
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(buttonText);
    if (level === 'month') {
      button.appendChild(createElement('span', 'life-month-count', `${photoCount} 张`));
    }
    button.appendChild(icon);
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

  const createMonthArchive = item => {
    const archive = createElement('div', 'life-month-archive');

    if (item.text) {
      const note = createElement('p', 'life-month-note');
      const pin = createElement('i', 'fas fa-thumbtack');
      pin.setAttribute('aria-hidden', 'true');
      note.append(pin, document.createTextNode(item.text));
      archive.appendChild(note);
    }

    if (item.photos.length) {
      const photoGrid = createElement('div', 'life-photo-grid');
      photoGrid.dataset.count = String(item.photos.length);
      item.photos.forEach((photo, index) => photoGrid.appendChild(createPhoto(photo, item.photos, index)));
      archive.appendChild(photoGrid);
    } else {
      archive.appendChild(createElement('p', 'life-empty', '这个月的照片正在整理中。'));
    }

    return archive;
  };

  const normalizedMonths = monthRecords
    .map(record => ({
      ...record,
      monthData: parseMonth(record.month),
      photos: Array.isArray(record.photos) ? record.photos.filter(photo => photo && photo.src) : []
    }))
    .filter(record => record.monthData)
    .sort((a, b) => b.monthData.key.localeCompare(a.monthData.key));

  if (!normalizedMonths.length) {
    logRoot.appendChild(createElement('p', 'life-empty', '生活影像正在整理中。'));
  } else {
    const years = new Map();
    normalizedMonths.forEach(record => {
      if (!years.has(record.monthData.year)) years.set(record.monthData.year, []);
      years.get(record.monthData.year).push(record);
    });

    years.forEach((months, year) => {
      const yearSection = createElement('section', 'life-year-group');
      const yearContentId = `life-year-content-${year}`;
      const yearDisclosure = createDisclosure('year', year, yearContentId);
      const yearCollapsible = createCollapsible('life-year-content');
      yearCollapsible.content.id = yearContentId;

      months.forEach(monthRecord => {
        const month = monthRecord.monthData.month;
        const monthSection = createElement('section', 'life-month-group');
        const monthLabel = monthRecord.monthData.monthName;
        const monthContentId = `life-month-content-${year}-${month}`;
        const monthDisclosure = createDisclosure('month', monthLabel, monthContentId, monthRecord.photos.length);
        const monthCollapsible = createCollapsible('life-month-content');
        monthCollapsible.content.id = monthContentId;
        monthCollapsible.inner.appendChild(createMonthArchive(monthRecord));
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
