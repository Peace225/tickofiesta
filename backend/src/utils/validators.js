const Joi = require('joi');

const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Le nom est requis',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': "L'email est requis",
  }),
  mot_de_passe: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Le mot de passe est requis',
  }),
  role: Joi.string().valid('client', 'organisateur').default('client'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    });
  }
  next();
};

module.exports = { registerSchema, loginSchema, validate };
