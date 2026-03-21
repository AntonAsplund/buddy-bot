const verifyAccessForPhoneNumber = (phoneNumber) => {
    const allowedPhones = process.env.ALLOWED_PHONES.split(',').map(phone => phone.trim());
    return allowedPhones.includes(phoneNumber);
}

const getUserGroupForPhoneNumber = (phoneNumber) => {
    if (phoneNumber === process.env.ADMIN_PHONE.split(',').map(phone => phone.trim())) {
        return 'admin';
    }

    return 'user';
};

module.exports = { getUserGroupForPhoneNumber, verifyAccessForPhoneNumber };