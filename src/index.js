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

const initialState = { state: 'valid', 
                errors: [],
                feeds: [],
                posts: [],
                feedback: ''
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
          parsing_error: 'Ресурс не содержит валидный RSS'
        }
      }
    }
  }
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
  const proxifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`
  return axios.get(proxifiedUrl)
    .then((response) => {
      const domParser = new DOMParser;
      const parsedResponse = domParser.parseFromString(response.data.contents, 'text/xml');
      return parsedResponse;
    })
    .catch((error) => {
      console.log(error);
      state.state = 'invalid';
      state.feedback = i18n.t('errors.network_error');
    })
};

const parsingPeriod = 5000;

const parsePosts = (feed) => {
  downloadFeed(feed.url)
    .then((rawFeed) => {
      const rawPosts = rawFeed.querySelector('channel').querySelectorAll('item');
      rawPosts.forEach((rawPost) => {
        const guid = rawPost.querySelector('guid').textContent;
        if(state.posts.filter((post) => post.feed_id === feed.id 
                                        && post.guid === guid ).length > 0) return;

        const post = { id: _.uniqueId(), feed_id: feed.id, guid: guid, viewed: false }
        post.title = rawPost.querySelector('title').textContent;
        post.description = rawPost.querySelector('description').textContent;
        post.link = rawPost.querySelector('link').textContent;
        state.posts.push(post);
      })
    })
    .then(() => {
      setTimeout(parsePosts(feed), parsingPeriod);
    })
    .catch((error) => {
      console.log(error);
    })
};

const handleSubmission = () => {
  const newFeed = { id: _.uniqueId(), url: formData().url }
  downloadFeed(newFeed.url)
    .then((rawFeed) => {
      const channel = rawFeed.querySelector('channel');
      newFeed.title = channel.querySelector('title').textContent;
      newFeed.description = channel.querySelector('description')?.textContent;
      state.feeds.push(newFeed);

      parsePosts(newFeed);

      state.state = 'valid';
      state.feedback = i18n.t('success');
      
      prepareInput();
    })
    .catch((error) => {
      console.log(error);
      state.state = 'invalid';
      state.feedback = i18n.t('errors.parsing_error')
    })
}

const prepareInput = () => {
  elements.input.value = '';
  elements.input.focus();
}

const validate = (fields) => {
  const schema = yup.object({
    url: yup.string()
      .url()
      .required()
      .notOneOf(state.feeds.map((feed) => feed.url)),
  });

  state.feedback = '';
  schema.validate(fields, { abortEarly: false })
    .then(() => {
      handleSubmission();
    })
    .catch((e) => {
      state.state = 'invalid';
      state.feedback = i18n.t(`errors.${e.errors[0]}`)
    });
};

const onFormSubmit = (e) => {
  e.preventDefault();
  state.state = 'in_progress';
  validate(formData());
}

elements.form.addEventListener('submit', onFormSubmit);
