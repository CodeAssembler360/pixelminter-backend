const validation = require("../helper/validator");

const userLogin = [
  validation.requiredFieldValidationMW("email"),
  validation.emailFieldValidationMW("email"),
  validation.requiredFieldValidationMW("password"),
];
const signup = [
  validation.requiredFieldValidationMW("email"),
  validation.emailFieldValidationMW("email"),
  validation.requiredFieldValidationMW("password"),
];
const uploadfiles = [validation.requiredFieldValidationMW("name")];
const signature = [validation.requiredFieldValidationMW("signature")];

const middlewares = {
  signup: [signup, validation.validationResultMW],
  login: [userLogin, validation.validationResultMW],
  uploadfiles: [uploadfiles, validation.validationResultMW],
  signature: [signature, validation.validationResultMW],
};
module.exports = middlewares;
