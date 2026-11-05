/**
 * Validate client input for creating/updating clients
 */
const validateClientInput = (req, res, next) => {
  const { name, email, phone, type, status } = req.body;

  // Validate name
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres.' });
  }

  // Validate name length (max 255 characters)
  if (String(name).trim().length > 255) {
    return res.status(400).json({ error: 'El nombre no puede exceder 255 caracteres.' });
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }
  }

  // Validate phone if provided
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'El teléfono debe tener al menos 10 dígitos.' });
    }
  }

  // Validate client type if provided
  if (type && !['personal', 'empresa', 'prospecto'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de cliente inválido. Debe ser: personal, empresa o prospecto.' });
  }

  // Validate client status if provided
  if (status && !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido. Debe ser: active, inactive o suspended.' });
  }

  // Sanitize and trim string fields
  req.body.name = String(name).trim();
  if (req.body.email) req.body.email = String(email).trim().toLowerCase();
  if (req.body.phone) req.body.phone = String(phone).trim();

  next();
};

/**
 * Validate policy input for creating/updating policies
 */
const validatePolicyInput = (req, res, next) => {
  const { policyNumber, policyType, premium, status } = req.body;

  // Validate policy number
  if (!policyNumber || String(policyNumber).trim().length < 3) {
    return res.status(400).json({ error: 'El número de póliza debe tener al menos 3 caracteres.' });
  }

  // Validate policy type
  if (!policyType || !['auto', 'hogar', 'vida', 'salud', 'otro'].includes(policyType)) {
    return res.status(400).json({ error: 'Tipo de póliza inválido.' });
  }

  // Validate premium
  if (premium !== undefined) {
    const premiumNum = parseFloat(premium);
    if (isNaN(premiumNum) || premiumNum < 0) {
      return res.status(400).json({ error: 'La prima debe ser un número positivo.' });
    }
  }

  // Validate status
  if (status && !['active', 'expired', 'suspended', 'canceled'].includes(status)) {
    return res.status(400).json({ error: 'Estado de póliza inválido.' });
  }

  req.body.policyNumber = String(policyNumber).trim();
  if (req.body.premium) req.body.premium = parseFloat(req.body.premium);

  next();
};

module.exports = { validateClientInput, validatePolicyInput };
