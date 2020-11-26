const DEFAULT_TIMEOUT = 5000;

module.exports = {
  DEFAULT_TIMEOUT,
  promiseTimeout: (promise, ms = DEFAULT_TIMEOUT) => {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject({message: 'Timed out in '+ ms + 'ms.'});
      }, ms)
    })

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ]);
  },
  fieldsFromBody: (body, fieldNames) => {
    let fields = {};
    fieldNames.forEach((field) => {
      fields[field] = body[field];
    });
    return fields;
  },
};
