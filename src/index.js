import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import watchedState from './view';

const elements = {
  form: document.querySelector('form'),
  input: document.querySelector('#url-input'),
  feedbackContainer: document.querySelector('.feedback'),
  feedsContainer: document.querySelector('.feeds'),
  postsContainer: document.querySelector('.posts'),
  submitButton: document.querySelector('[type="submit"]'),
  modal: document.querySelector('#modal'),
};

const formData = () => Object.fromEntries(new FormData(elements.form).entries());

const initialState = {
  state: 'valid',
  errors: [],
  feeds: [],
  posts: [],
  feedback: '',
  viewedPosts: [],
  modalPostId: null,
};

const i18n = i18next.createInstance();

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
          already_exists: 'RSS уже существует',
          is_blank: 'Не должно быть пустым',
          invalid_url: 'Ссылка должна быть валидным URL',
          network_error: 'Ошибка сети',
          parsing_error: 'Ресурс не содержит валидный RSS',
        },
      },
    },
  },
});

const state = watchedState(initialState, i18n, elements);

yup.setLocale({
  mixed: {
    notOneOf: 'already_exists',
    required: 'is_blank',
  },
  string: {
    url: 'invalid_url',
  },
});

const downloadFeed = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;
  return axios.get(proxifiedUrl)
    .catch(() => {
      throw new Error('network_error');
    });
};

const parseResponse = (response) => {
  try {
    const domParser = new DOMParser();
    const parsedResponse = domParser.parseFromString(response.data.contents, 'text/xml');
    return parsedResponse;
  } catch {
    throw new Error('parsing_error');
  }
};

const parsingPeriod = 5000;

const parsePosts = (rawFeed) => {
  const rawPosts = rawFeed.querySelector('channel').querySelectorAll('item');
  return Array.from(rawPosts).map((rawPost) => ({
    title: rawPost.querySelector('title').textContent,
    description: rawPost.querySelector('description').textContent,
    link: rawPost.querySelector('link').textContent,
    guid: rawPost.querySelector('guid').textContent,
  }));
};

const keepUpdatingFeed = (feed) => {
  downloadFeed(feed.url)
    .then((response) => parseResponse(response))
    .then((rawFeed) => {
      const existingPostsGuids = state.posts.map((el) => el.guid);
      const newPosts = parsePosts(rawFeed)
        .filter((newPost) => !existingPostsGuids.includes(newPost.guid));

      newPosts.forEach((post) => {
        post.id = _.uniqueId();
        post.feed_id = feed.id;
        state.posts.push(post);
      });
      setTimeout(keepUpdatingFeed(feed), parsingPeriod);
    })
    .catch(() => {
      setTimeout(keepUpdatingFeed(feed), parsingPeriod);
    });
};

const parseFeed = (rawFeed) => {
  try {
    const channel = rawFeed.querySelector('channel');
    return {
      title: channel.querySelector('title').textContent,
      description: channel.querySelector('description')?.textContent,
      posts: parsePosts(rawFeed),
    };
  } catch {
    throw new Error('parsing_error');
  }
};

const validate = (fields) => {
  const schema = yup.object({
    url: yup.string()
      .url()
      .required()
      .notOneOf(state.feeds.map((feed) => feed.url)),
  });
  return schema.validate(fields, { abortEarly: false })
    .catch((e) => {
      throw new Error(e.errors[0]);
    });
};

const prepareInput = () => {
  elements.input.value = '';
  elements.input.focus();
};

const handleSubmission = () => {
  const { url } = formData();
  validate(formData())
    .then(() => downloadFeed(url))
    .then((response) => parseResponse(response))
    .then((rawFeed) => parseFeed(rawFeed))
    .then((feedData) => {
      const feed = {
        id: _.uniqueId(),
        url,
        title: feedData.title,
        description: feedData.description,
      };

      state.feeds.push(feed);
      feedData.posts.forEach((post) => {
        post.id = _.uniqueId();
        post.feed_id = feed.id;
        state.posts.push(post);
      });
      state.feedback = i18n.t('success');
      state.state = 'valid';

      prepareInput();
      keepUpdatingFeed(feed);
    })
    .catch((error) => {
      state.state = 'invalid';
      state.feedback = i18n.t(`errors.${error.message}`);
    });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  state.feedback = '';
  state.state = 'in_progress';
  handleSubmission();
};

elements.form.addEventListener('submit', onFormSubmit);

elements.postsContainer.addEventListener('click', (e) => {
  const postId = e.target.dataset.id;
  if (!postId) return;

  state.modalPostId = postId;
  if (!state.viewedPosts.includes(postId)) state.viewedPosts.push(postId);
});
