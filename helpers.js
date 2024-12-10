
// userLookup helper function to find registered users
const userLookup = function(userEmail, database) {
  for (const userId in database) {
    if (database[userId].email === userEmail) {
      return userId;
    }
  }
  return "";
};

//// Generate a random string of length 6
const generateRandomString = function(database) {

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  
  if (!database[result]) {
    return result;
  
  } else {
    return generateRandomString();
  }
};


module.exports = {
  userLookup,
  generateRandomString
};