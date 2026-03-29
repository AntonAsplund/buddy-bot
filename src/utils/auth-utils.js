/**
 * Verify if a phone number is allowed
 * @param {string} phoneNumber - The phone number (from contact.number)
 * @returns {boolean} - Whether the phone number is in the allowed list
 */
const verifyAccessForPhoneNumber = (phoneNumber) => {
    const allowedPhones = process.env.ALLOWED_PHONES.split(',').map(phone => phone.trim());
    return allowedPhones.includes(phoneNumber);
}

/**
 * Get the user group for a phone number
 * @param {string} phoneNumber - The phone number (from contact.number)
 * @returns {string} - 'admin' or 'user'
 */
const getUserGroupForPhoneNumber = (phoneNumber) => {
    const adminPhones = process.env.ADMIN_PHONE.split(',').map(phone => phone.trim());
    return adminPhones.includes(phoneNumber) ? 'admin' : 'user';
};

module.exports = { getUserGroupForPhoneNumber, verifyAccessForPhoneNumber };