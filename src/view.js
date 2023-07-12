import onChange from 'on-change';

const styleForm = (state, elements) => {
  elements.input.classList.toggle('is-invalid', state.state === 'invalid');
  elements.input.readonly = state.state === 'in_progress';
  elements.submitButton.disabled = state.state === 'in_progress';
}

const renderFeedback = (state, feedbackContainer) => {
  feedbackContainer.classList.toggle('text-success', state.state === 'valid');
  feedbackContainer.classList.toggle('text-danger', state.state != 'valid');
  feedbackContainer.textContent = state.feedback;
}

const renderFeeds = (state, i18n, feedsContainer) => {
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

const renderPosts = (state, i18n, elements) => {

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
      postLink.classList.toggle('fw-bold', !post.viewed);
      postLink.classList.toggle('fw-normal', post.viewed);
      postLink.textContent = post.title;
      postLink.href = post.link;
      postLink.dataset.id = post.id;
      postLink.target = '_blank';
      postLink.rel = 'noopener noreferrer';
      postLi.append(postLink);

      const modal = elements.modal;
      const postPreview = document.createElement('button');
      postPreview.type = 'button';
      postPreview.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      postPreview.dataset.id = post.id;
      postPreview.dataset.bsToggle = 'modal';
      postPreview.dataset.bsTarget = `#${modal.id}`;
      postPreview.textContent = i18n.t('view');
      postPreview.addEventListener('click', (e) => {
        const post = state.posts.find((post) => post.id === e.target.dataset.id);
        modal.querySelector('.modal-title').textContent = post.title;
        modal.querySelector('.modal-body').textContent = post.description;
        modal.querySelector('a.read').href = post.link;
      })
      postLi.append(postPreview);

      postsList.prepend(postLi);
    })
    
    postsCard.append(postsList);
    
    elements.postsContainer.innerHTML = '';
    elements.postsContainer.append(postsCard);
  }
}

export default (state, i18n, elements) => {
  return onChange(state, () => {
    styleForm(state, elements);
    renderFeedback(state, elements.feedbackContainer);
    renderFeeds(state, i18n, elements.feedsContainer);
    renderPosts(state, i18n, elements);
  });
};
