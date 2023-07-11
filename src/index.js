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
  submitButton: document.querySelector('[type="submit"]')
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
          invalid_url: 'Ссылка должна быть валидным URL',
          parsing_error: 'Проблемы с парсингом фида, это точно RSS?'
        }
      }
    }
  }
});

const state = watchedState(initialState, i18n, elements);

yup.setLocale({
  string: {
    url: 'invalid_url'
  },
});

const schema = yup.object({
  url: yup.string()
    .url()
    .required()
    .notOneOf(state.feeds.map((feed) => feed.url)),
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

      const rawPosts = channel.querySelectorAll('item');
      rawPosts.forEach((rawPost) => {
        const post = { id: _.uniqueId, feed_id: newFeed.id }
        post.title = rawPost.querySelector('title').textContent;
        post.description = rawPost.querySelector('description').textContent;
        post.link = rawPost.querySelector('link').textContent;
        state.posts.push(post);
      })

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
