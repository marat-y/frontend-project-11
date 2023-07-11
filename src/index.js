import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import i18n from 'i18next';
import onChange from 'on-change';
import _ from 'lodash';
import axios from 'axios';

const form = document.querySelector('form');
const formData = () => Object.fromEntries(new FormData(form).entries());
const input = document.querySelector('#url-input');
const feedbackContainer = document.querySelector('.feedback');
const feedsContainer = document.querySelector('.feeds');
const postsContainer = document.querySelector('.posts');

const state = { state: 'valid', 
                errors: [],
                feeds: [],
                posts: [],
                feedback: ''
              };

i18n.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru: {
      translation: {
        feeds: 'Фиды',
        posts: 'Посты',
        view: 'Просмотр',
        success: 'RSS успешно загружен',
        errors: {
          invalid_url: 'Ссылка должна быть валидным URL'
        }
      }
    }
  }
});

const watchedState = onChange(state, () => {
  styleInput();
  renderFeedback();
  renderFeeds();
  renderPosts();
});

const styleInput = () => {
  input.classList.toggle('is-invalid', watchedState.state != 'valid');
}

const renderFeedback = () => {
  feedbackContainer.classList.toggle('text-success', watchedState.state === 'valid');
  feedbackContainer.classList.toggle('text-danger', watchedState.state != 'valid');
  feedbackContainer.textContent = watchedState.feedback;
}

const renderFeeds = () => {
  if (watchedState.feeds.length > 0) {
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
    
    watchedState.feeds.forEach((feed) => {
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

const renderPosts = () => {

  if (watchedState.posts.length > 0) {
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

    watchedState.posts.forEach((post) => {
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

yup.setLocale({
  string: {
    url: 'invalid_url'
  },
});

const schema = yup.object({
  url: yup.string()
    .url()
    .required()
    .notOneOf(watchedState.feeds),
});

const downloadFeed = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`
  return axios.get(proxifiedUrl)
    .then((response) => {
      console.log('axios response:');
      console.log(response);
      const domParser = new DOMParser;
      const parsedResponse = domParser.parseFromString(response.data.contents, 'text/xml');
      return parsedResponse;
    })
    .catch((error) => {
      // handle error
      console.log(error);
    })
};

const addFeed = () => {
  const newFeed = { id: _.uniqueId(), url: formData().url }
  downloadFeed(newFeed.url)
    .then((rawFeed) => {
      const channel = rawFeed.querySelector('channel');
      newFeed.title = channel.querySelector('title').textContent;
      newFeed.description = channel.querySelector('description')?.textContent;
      watchedState.feeds.push(newFeed);

      const rawPosts = channel.querySelectorAll('item');
      rawPosts.forEach((rawPost) => {
        const post = { id: _.uniqueId, feed_id: newFeed.id }
        post.title = rawPost.querySelector('title').textContent;
        post.description = rawPost.querySelector('description').textContent;
        post.link = rawPost.querySelector('link').textContent;
        watchedState.posts.push(post);
      })
      watchedState.feedback = i18n.t('success');
    })
}

const prepareInput = () => {
  input.value = '';
  input.focus();
}

const onValidSubmit = () => {
  addFeed();
  prepareInput();
}

const validate = (fields) => {
  watchedState.feedback = '';
  schema.validate(fields, { abortEarly: false })
    .then(() => {
      watchedState.state = 'valid';
      onValidSubmit();
    })
    .catch((e) => {
      watchedState.state = 'invalid';
      watchedState.feedback = i18n.t(`errors.${e.errors[0]}`)
    });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  validate(formData());
}

form.addEventListener('submit', onFormSubmit);
