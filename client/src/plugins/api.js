/* eslint-disable no-param-reassign */
class Api {
  endpoints = {
    categories: 'categories',
    banknames: 'banknames',
  };

  genericError = 'An error ocurred. Try it again later...';

  static endpoint(endpoint, ...args) {
    let count = 0;

    args.forEach((element) => {
      count += 1;
      endpoint = endpoint.replace(`{${count}}`, element);
    });

    return endpoint;
  }

  getErrorMessage(error) {
    if (error && error.response && error.response.data && error.response.data.message) {
      return error.response.data.message;
    }

    if (error && error.response && error.response.statusText) {
      return error.response.statusText;
    }

    return this.genericError;
  }

  categories() {
    const url = Api.endpoint(this.endpoints.categories);
    return this.axios.get(url);
  }

  bankNames() {
    const url = Api.endpoint(this.endpoints.banknames);
    return this.axios.get(url);
  }
}

const api = new Api();

const ApiPlugin = {
  install(app, options) {
    app.config.globalProperties.api = api;
    api.axios = options.axios;
  },
  api,
};

export function useApi() {
  return api;
}

export default ApiPlugin;
