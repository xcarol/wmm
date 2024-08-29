export const categorizeUrlPath = (filter, category) => {
  let separator = '?';
  let path = '/categorize';

  if (filter) {
    path += `${separator}filter=${filter}`;
    separator = '&';
  }
  if (category) {
    path += `${separator}category=${category}`;
  }

  return path;
};

export default {
  categorizeUrlPath,
};
