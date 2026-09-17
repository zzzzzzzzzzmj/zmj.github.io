/* global CONFIG */

// Keep the resolved script URL before DOMContentLoaded; document.currentScript is
// no longer available inside the event callback. It also gives us a reliable
// site root for sub-directory deployments and direct file:// browsing.
const localSearchScriptUrl = document.currentScript && document.currentScript.src;

document.addEventListener('DOMContentLoaded', () => {
  if (!CONFIG.path) {
    // Search DB path
    console.warn('`hexo-generator-searchdb` plugin is not installed!');
    return;
  }
  // Popup Window
  let isfetched = false;
  let datas;
  const input = document.querySelector('.search-input');
  const siteRootUrl = localSearchScriptUrl
    ? new URL('../../../', localSearchScriptUrl)
    : new URL(CONFIG.root || './', location.href);

  const getIndexByWord = (words, text, caseSensitive = false) => {
    const index = [];
    const included = new Set();
    words.forEach(word => {
      if (CONFIG.localsearch.unescape) {
        const div = document.createElement('div');
        div.innerText = word;
        word = div.innerHTML;
      }
      const wordLen = word.length;
      if (wordLen === 0) return;
      let startPosition = 0;
      let position = -1;
      if (!caseSensitive) {
        text = text.toLowerCase();
        word = word.toLowerCase();
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word });
        included.add(word);
        startPosition = position + wordLen;
      }
    });
    // Sort index by position of keyword
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position;
      }
      return right.word.length - left.word.length;
    });
    return [index, included];
  };

  // Merge hits into slices
  const mergeIntoSlice = (start, end, index) => {
    let item = index[0];
    let { position, word } = item;
    const hits = [];
    const count = new Set();
    while (position + word.length <= end && index.length !== 0) {
      count.add(word);
      hits.push({
        position,
        length: word.length
      });
      const wordEnd = position + word.length;

      // Move to next position of hit
      index.shift();
      while (index.length !== 0) {
        item = index[0];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.shift();
        } else {
          break;
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    };
  };

  // Highlight title and content
  const highlightKeyword = (val, slice) => {
    let result = '';
    let index = slice.start;
    for (const { position, length } of slice.hits) {
      result += val.substring(index, position);
      index = position + length;
      result += `<mark class="search-keyword">${val.substr(position, length)}</mark>`;
    }
    result += val.substring(index, slice.end);
    return result;
  };

  const getResultItems = keywords => {
    const resultItems = [];
    datas.forEach(({ title, content, url }) => {
      // The number of different keywords included in the article.
      const [indexOfTitle, keysOfTitle] = getIndexByWord(keywords, title);
      const [indexOfContent, keysOfContent] = getIndexByWord(keywords, content);
      const includedCount = new Set([...keysOfTitle, ...keysOfContent]).size;

      // Show search results
      const hitCount = indexOfTitle.length + indexOfContent.length;
      if (hitCount === 0) return;

      const slicesOfTitle = [];
      if (indexOfTitle.length !== 0) {
        slicesOfTitle.push(mergeIntoSlice(0, title.length, indexOfTitle));
      }

      let slicesOfContent = [];
      while (indexOfContent.length !== 0) {
        const item = indexOfContent[0];
        const { position } = item;
        // Cut out 100 characters. The maxlength of .search-input is 80.
        const start = Math.max(0, position - 20);
        const end = Math.min(content.length, position + 80);
        slicesOfContent.push(mergeIntoSlice(start, end, indexOfContent));
      }

      // Sort slices in content by included keywords' count and hits' count
      slicesOfContent.sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count;
        } else if (left.hits.length !== right.hits.length) {
          return right.hits.length - left.hits.length;
        }
        return left.start - right.start;
      });

      // Select top N slices in content
      const upperBound = parseInt(CONFIG.localsearch.top_n_per_article, 10);
      if (upperBound >= 0) {
        slicesOfContent = slicesOfContent.slice(0, upperBound);
      }

      let resultItem = '';

      url = new URL(url.replace(/^\/+/, ''), siteRootUrl);
      url.searchParams.append('highlight', keywords.join(' '));

      if (slicesOfTitle.length !== 0) {
        resultItem += `<li><a href="${url.href}" class="search-result-title">${highlightKeyword(title, slicesOfTitle[0])}</a>`;
      } else {
        resultItem += `<li><a href="${url.href}" class="search-result-title">${title}</a>`;
      }

      slicesOfContent.forEach(slice => {
        resultItem += `<a href="${url.href}"><p class="search-result">${highlightKeyword(content, slice)}...</p></a>`;
      });

      resultItem += '</li>';
      resultItems.push({
        item: resultItem,
        id  : resultItems.length,
        hitCount,
        includedCount
      });
    });
    return resultItems;
  };

  const inputEventFunction = () => {
    if (!isfetched) return;
    const searchText = input.value.trim().toLowerCase();
    const keywords = searchText.split(/[-\s]+/);
    const container = document.querySelector('.search-result-container');
    let resultItems = [];
    if (searchText.length > 0) {
      // Perform local searching
      resultItems = getResultItems(keywords);
    }
    if (keywords.length === 1 && keywords[0] === '') {
      container.classList.add('no-result');
      container.innerHTML = '<div class="search-result-icon"><i class="fa fa-search fa-5x"></i></div>';
    } else if (resultItems.length === 0) {
      container.classList.add('no-result');
      container.innerHTML = '<div class="search-result-icon"><i class="far fa-frown fa-5x"></i></div>';
    } else {
      resultItems.sort((left, right) => {
        if (left.includedCount !== right.includedCount) {
          return right.includedCount - left.includedCount;
        } else if (left.hitCount !== right.hitCount) {
          return right.hitCount - left.hitCount;
        }
        return right.id - left.id;
      });
      const stats = CONFIG.i18n.hits.replace(/\$\{hits}/, resultItems.length);

      container.classList.remove('no-result');
      container.innerHTML = `<div class="search-stats">${stats}</div>
        <hr>
        <ul class="search-result-list">${resultItems.map(result => result.item).join('')}</ul>`;
      window.pjax && window.pjax.refresh(container);
    }
  };

  const prepareData = source => {
    isfetched = true;
    datas = source.filter(data => data.title).map(data => ({
      title  : data.title.trim(),
      content: data.content ? data.content.trim().replace(/<[^>]+>/g, '') : '',
      url    : decodeURIComponent(data.url).replace(/\/{2,}/g, '/')
    }));
    inputEventFunction();
  };

  const showLoadError = error => {
    console.error('[Local Search] Failed to load the search index:', error);
    const container = document.querySelector('.search-result-container');
    container.classList.add('no-result');
    container.innerHTML = '<p class="search-load-error">搜索索引加载失败，请刷新页面后重试。</p>';
  };

  const fetchData = () => {
    // Browsers block fetch() for local XML files. Load a compact JavaScript
    // index instead so the site remains searchable when index.html is opened
    // directly from disk.
    if (location.protocol === 'file:') {
      if (window.LOCAL_SEARCH_DATA) {
        prepareData(window.LOCAL_SEARCH_DATA);
        return;
      }
      const script = document.createElement('script');
      script.src = new URL('js/search-data.js', siteRootUrl).href;
      script.onload = () => prepareData(window.LOCAL_SEARCH_DATA || []);
      script.onerror = showLoadError;
      document.head.appendChild(script);
      return;
    }

    const isXml = !CONFIG.path.endsWith('json');
    const searchIndexUrl = new URL(CONFIG.path.replace(/^\/+/, ''), siteRootUrl);
    fetch(searchIndexUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(res => {
        const source = isXml
          ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => ({
            title  : element.querySelector('title').textContent,
            content: element.querySelector('content').textContent,
            url    : element.querySelector('url').textContent
          }))
          : JSON.parse(res);
        prepareData(source);
      })
      .catch(showLoadError);
  };

  // Highlight by wrapping node in mark elements with the given class name
  const highlightText = (node, slice, className) => {
    const val = node.nodeValue;
    let index = slice.start;
    const children = [];
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position));
      index = position + length;
      const mark = document.createElement('mark');
      mark.className = className;
      mark.appendChild(document.createTextNode(val.substr(position, length)));
      children.push(text, mark);
    }
    node.nodeValue = val.substring(index, slice.end);
    children.forEach(element => {
      node.parentNode.insertBefore(element, node);
    });
  };

  // Highlight the search words provided in the url in the text
  const highlightSearchWords = () => {
    const params = new URL(location.href).searchParams.get('highlight');
    const keywords = params ? params.split(' ') : [];
    const body = document.querySelector('.post-body');
    if (!keywords.length || !body) return;
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const allNodes = [];
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea')) allNodes.push(walk.currentNode);
    }
    allNodes.forEach(node => {
      const [indexOfNode] = getIndexByWord(keywords, node.nodeValue);
      if (!indexOfNode.length) return;
      const slice = mergeIntoSlice(0, node.nodeValue.length, indexOfNode);
      highlightText(node, slice, 'search-keyword');
    });
  };

  highlightSearchWords();
  if (CONFIG.localsearch.preload) {
    fetchData();
  }

  if (CONFIG.localsearch.trigger === 'auto') {
    input.addEventListener('input', inputEventFunction);
  } else {
    document.querySelector('.search-icon').addEventListener('click', inputEventFunction);
    input.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        inputEventFunction();
      }
    });
  }

  // Handle and trigger popup window
  document.querySelectorAll('.popup-trigger').forEach(element => {
    element.addEventListener('click', () => {
      document.body.classList.add('search-active');
      // Wait for search-popup animation to complete
      setTimeout(() => input.focus(), 500);
      if (!isfetched) fetchData();
    });
  });

  // Monitor main search box
  const onPopupClose = () => {
    document.body.classList.remove('search-active');
  };

  document.querySelector('.search-pop-overlay').addEventListener('click', event => {
    if (event.target === document.querySelector('.search-pop-overlay')) {
      onPopupClose();
    }
  });
  document.querySelector('.popup-btn-close').addEventListener('click', onPopupClose);
  document.addEventListener('pjax:success', () => {
    highlightSearchWords();
    onPopupClose();
  });
  window.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      onPopupClose();
    }
  });
});
