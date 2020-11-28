const mongoose = require('mongoose');

module.exports = (schema, name) => {
  Array.prototype.forEach.call(schema.requiredPaths(), requiredField => {
    let capitalizedFieldName = requiredField.charAt(0).toUpperCase() + requiredField.slice(1);
    schema.static(`findBy${capitalizedFieldName}`, function(fieldValue) { return this.find({ [requiredField]: fieldValue }); });
    schema.static(`findOneBy${capitalizedFieldName}`, function(fieldValue) { return this.findOne({ [requiredField]: fieldValue }); });
  });

  let collection = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).slice(1) + 's';

  return mongoose.model(name, schema, collection);
}
