(function() {
    const DEFAULT_SUBSTACK_URL = 'https://imightbeanidiot.substack.com';
    const NATIVE_FEED_API_URL = '/api/rss-json';

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    function stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    function calculateReadTime(content) {
        if (!content) return '';
        const text = stripHtml(content);
        const wordCount = text.split(/\s+/).filter(function(word) { return word.length > 0; }).length;
        const readTime = Math.ceil(wordCount / 200);
        return readTime > 0 ? readTime + ' min read' : '';
    }
    function renderFeedItem(item) {
        const link = item.link || '#';
        const title = item.title || 'Post';
        const rawDescription = item.description || '';
        const cleanDescription = stripHtml(rawDescription).trim();
        const imageUrl = item.image || '';
        const readTime = calculateReadTime(item.content || item.description);
        const categories = item.categories || [];
        let date = '';
        if (item.pubDate) {
            try {
                const pubDate = new Date(item.pubDate);
                const now = new Date();
                const diffMs = now - pubDate;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffMinutes < 1) {
                    date = 'Just now';
                } else if (diffMinutes < 60) {
                    date = diffMinutes === 1 ? '1 minute ago' : diffMinutes + ' minutes ago';
                } else if (diffHours < 24) {
                    date = diffHours === 1 ? '1 hour ago' : diffHours + ' hours ago';
                } else if (diffDays < 7) {
                    date = diffDays === 1 ? '1 day ago' : diffDays + ' days ago';
                } else {
                    date = pubDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                }
            } catch (_) {}
        }
        let imageHtml = '';
        const shouldShowImage = Boolean(imageUrl);
        if (shouldShowImage) {
            imageHtml = '<div class="substack-feed-card-image"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(title) + '" loading="lazy"></div>';
        }
        const metaInfo = [];
        if (date) metaInfo.push(date);
        if (readTime) metaInfo.push(readTime);
        const metaText = metaInfo.join(' • ');
        
        let tagsHtml = '';
        if (categories && categories.length > 0) {
            const tags = categories.slice(0, 3).map(function(cat) {
                return '<span class="substack-feed-card-tag">' + escapeHtml(cat) + '</span>';
            }).join('');
            tagsHtml = '<div class="substack-feed-card-tags">' + tags + '</div>';
        }
        
        const cardClasses = 'substack-feed-card ui-surface' + (shouldShowImage ? ' substack-feed-card--with-image' : '');
        return '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer" class="' + cardClasses + '">' +
            '<div class="substack-feed-card-content">' +
            '<h3 class="substack-feed-card-title"><span class="substack-feed-text-bg">' + escapeHtml(title) + '</span></h3>' +
            (metaText ? '<span class="substack-feed-card-meta"><span class="substack-feed-text-bg">' + escapeHtml(metaText) + '</span></span>' : '') +
            (cleanDescription ? '<p class="substack-feed-card-description"><span class="substack-feed-text-bg">' + escapeHtml(cleanDescription.substring(0, 120)) + (cleanDescription.length > 120 ? '…' : '') + '</span></p>' : '') +
            tagsHtml +
            '</div>' +
            imageHtml +
            '</a>';
    }
    var loadingHtml = '<div class="substack-feed-loading" aria-busy="true" aria-label="Loading feed"></div>';
    window.SUBSTACK_SKELETON_HTML = loadingHtml;

    function normalizeNativeFeedItem(item) {
        if (!item || typeof item !== 'object') return null;
        return {
            title: typeof item.title === 'string' ? item.title : '',
            link: typeof item.link === 'string' ? item.link : '',
            pubDate: typeof item.pubDate === 'string' ? item.pubDate : '',
            description: typeof item.description === 'string' ? item.description : '',
            content: typeof item.content === 'string' ? item.content : '',
            id: typeof item.id === 'string' ? item.id : '',
            author: typeof item.author === 'string' ? item.author : '',
            categories: Array.isArray(item.categories) ? item.categories.filter(function(cat) { return typeof cat === 'string'; }) : [],
            image: typeof item.image === 'string' ? item.image : ''
        };
    }

    function loadSubstackFeeds() {
        document.querySelectorAll('[data-substack-feed]').forEach(function (el) {
            if (!el.querySelector('.substack-feed-loading')) {
                el.innerHTML = loadingHtml;
            }
            fetch(NATIVE_FEED_API_URL)
                .then(function (r) {
                    if (!r.ok) {
                        throw new Error('HTTP ' + r.status);
                    }
                    return r.json();
                })
                .then(function (data) {
                    const allItems = Array.isArray(data.items)
                        ? data.items.map(normalizeNativeFeedItem).filter(Boolean)
                        : [];
                    if (!allItems.length) {
                        el.innerHTML = '<p class="substack-feed-error">No posts available.</p>';
                        return;
                    }
                    const initialCount = 4;
                    const batchSize = 4;
                    let displayedCount = Math.min(initialCount, allItems.length);
                    
                    const container = document.createElement('div');
                    container.className = 'substack-feed-cards ui-stack';
                    container.innerHTML = allItems.slice(0, displayedCount).map(renderFeedItem).join('');
                    
                    const loadMoreBtn = document.createElement('button');
                    loadMoreBtn.className = 'button secondary-button substack-load-more';
                    loadMoreBtn.type = 'button';
                    const loadMoreRow = document.createElement('div');
                    loadMoreRow.className = 'substack-feed-load-more-row';
                    loadMoreRow.appendChild(loadMoreBtn);

                    const updateSubstackLoadMoreLabel = () => {
                        const remaining = allItems.length - displayedCount;
                        if (remaining <= 0) {
                            loadMoreBtn.style.display = 'none';
                            return;
                        }
                        loadMoreBtn.textContent = 'Show more articles';
                        loadMoreBtn.style.display = '';
                    };
                    updateSubstackLoadMoreLabel();
                    
                    loadMoreBtn.addEventListener('click', function() {
                        const nextBatch = allItems.slice(displayedCount, displayedCount + batchSize);
                        if (nextBatch.length > 0) {
                            nextBatch.forEach(function(item) {
                                loadMoreRow.insertAdjacentHTML('beforebegin', renderFeedItem(item));
                            });
                            displayedCount += nextBatch.length;
                            updateSubstackLoadMoreLabel();
                        }
                    });
                    
                    el.innerHTML = '';
                    container.appendChild(loadMoreRow);
                    el.appendChild(container);
                })
                .catch(function (err) {
                    console.error('Substack feed error:', err);
                    el.innerHTML = '<p class="substack-feed-error">Unable to load feed. <a href="' + escapeHtml(DEFAULT_SUBSTACK_URL) + '" target="_blank" rel="noopener noreferrer">Visit Substack</a></p>';
                });
        });
    }
    window.loadSubstackFeeds = loadSubstackFeeds;
    function initFeeds() {
        loadSubstackFeeds();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFeeds);
    } else {
        setTimeout(initFeeds, 100);
    }
})();
