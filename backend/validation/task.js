const Validator = require('validator');
const isEmpty = require('is-empty');
module.exports = validateTaskInput = (data, index, allTasks) => {
  let errors = {};
  // Convert empty fields to an empty string so we can use validator functions
  data.taskname = !isEmpty(data.taskname) ? data.taskname.trim() : '';
  // data.qrID = !isEmpty(data.qrID) ? data.qrID : '';
  // data.physicalDeviceID = !isEmpty(data.physicalDeviceID) ? data.physicalDeviceID : '';
  data.maxTime = !isEmpty(data.maxTime) ? (parseInt(data.maxTime) || 20) : 20;
  data.format = !isEmpty(data.format) ? data.format : '';
  data.canBeNonVisual = !isEmpty(data.canBeNonVisual) ? data.canBeNonVisual : true;
  // data.predecessorTasks =

  if (Validator.isEmpty(data.taskname)) {
    errors.taskname = 'Name field is required';
  }
  if (!Validator.isLength(data.taskname, { min: 2, max: 15 })) {
    errors.taskname = data.taskname.length <= 15 ? 'Name must be at least 2 characters' : 'Name must be at most 15 characters';
  }
  if (Validator.isIn(data.taskname, allTasks.map((task, ind) => ind < index && task.taskname))) {
    errors.taskname = 'Name must be unique';
  }

  // if (Validator.isEmpty(data.qrID)) {
  //   errors.qrID = 'ID field is required';
  // }
  // if (!Validator.isLength(data.qrID, { min: 5, max: 7 })) {
  //   errors.qrID = data.qrID.length <= 7 ? 'ID must be at least 5 characters' : 'ID must be at most 7 characters';
  // }
  // if (Validator.isEmpty(data.physicalDeviceID)) {
  //   errors.physicalDeviceID = 'Device ID field is required';
  // }
  // if (!Validator.isLength(data.physicalDeviceID, { min: 20, max: 30 })) {
  //   errors.physicalDeviceID = data.physicalDeviceID.length <= 30 ? 'Device ID must be at least 20 characters' : 'Device ID must be at most 30 characters';
  // }

  if (Validator.isEmpty(data.format)) {
    errors.format = 'Format field is required';
  }
  if (!Validator.isIn(data.format, ['common','short','long','multipart'])) {
    errors.format = `Format must be one of ['common','short','long','multipart']`;
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
