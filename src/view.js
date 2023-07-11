import onChange from 'on-change';

const feedbackContainer = document.querySelector('.feedback');
const feedsContainer = document.querySelector('.feeds');
const postsContainer = document.querySelector('.posts');

const styleInput = (state, input) => {
  input.classList.toggle('is-invalid', state.state != 'valid');
}

const renderFeedback = (state) => {
  feedbackContainer.classList.toggle('text-success', state.state === 'valid');
  feedbackContainer.classList.toggle('text-danger', state.state != 'valid');
  feedbackContainer.textContent = state.feedback;
}

const renderFeeds = (state, i18n) => {
  if (state.feeds.length > 0) {
    const feedsCard = document.createElement('div');
    feedsCard.classList.add('card', 'border-0');

    const feedsTitleContainer = document.createElement('div');
    feedsTitleContainer.classList.add('card-body');
    
    const feedsTitle = document.createElement('h2');
    feedsTitle.classList.add('card-title', 'h4');
    feedsTitle.textContent = i18n.t('feeds');
    feedsTitleContainer.append(feedsTitle);

    feedsCard.append(feedsTitleContainer);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');
    
    state.feeds.forEach((feed) => {
      const feedLi = document.createElement('li');
      feedLi.classList.add('list-group-item', 'border-0', 'border-end-0');
      
      const feedTitle = document.createElement('h3');
      feedTitle.classList.add('h6', 'm-0');
      feedTitle.textContent = feed.title;
      feedLi.append(feedTitle);

      const feedDescription = document.createElement('p');
      feedDescription.classList.add('m-0', 'small', 'text-black-50');
      feedDescription.textContent = feed.description;
      feedLi.append(feedDescription);

      feedsList.append(feedLi);
    })
    
    feedsCard.append(feedsList);
    
    feedsContainer.innerHTML = '';
    feedsContainer.append(feedsCard);
  }
}

const renderPosts = (state, i18n) => {
  if (state.posts.length > 0) {
    const postsCard = document.createElement('div');
    postsCard.classList.add('card', 'border-0');

    const postsTitleContainer = document.createElement('div');
    postsTitleContainer.classList.add('card-body');

    const postsTitle = document.createElement('h2');
    postsTitle.classList.add('card-title', 'h4');
    postsTitle.textContent = i18n.t('posts');
    postsTitleContainer.append(postsTitle);

    postsCard.append(postsTitleContainer);

    const postsList = document.createElement('ul');
    postsList.classList.add('list-group', 'border-0', 'rounded-0');

    state.posts.forEach((post) => {
      const postLi = document.createElement('li');
      postLi.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      
      const postLink = document.createElement('a');
      postLink.classList.add('fw-bold');
      postLink.textContent = post.title;
      postLink.href = post.link;
      postLink.dataset.id = post.id;
      postLink.target = '_blank';
      postLink.rel = 'noopener noreferrer';
      postLi.append(postLink);

      const postPreview = document.createElement('button');
      postPreview.type = 'button';
      postPreview.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      postPreview.dataset.id = post.id;
      postPreview.dataset.bsToggle = 'modal';
      postPreview.dataset.bsTarget = '#modal';
      postPreview.textContent = i18n.t('view');
      postLi.append(postPreview);

      postsList.prepend(postLi);
    })
    
    postsCard.append(postsList);
    
    postsContainer.innerHTML = '';
    postsContainer.append(postsCard);
  }
}

export default (state, i18n, input) => {
  return onChange(state, () => {
    styleInput(state, input);
    renderFeedback(state);
    renderFeeds(state, i18n);
    renderPosts(state, i18n);
  });
};
