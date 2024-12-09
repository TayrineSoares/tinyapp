const { assert } = require('chai');

const { userLookup } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};


describe('userLookup', function() {
  it('should return a user ID with a valid email', function() {
    const userId = userLookup("user@example.com", testUsers);
    const expectedUserID = "userRandomID";

    assert.strictEqual(userId, expectedUserID, 'User ID should match');
  });

  it('should return null for an invalid email', function() {
    const userId = userLookup("nonexistent@example.com", testUsers);
    assert.strictEqual(userId, null, 'User ID should be null for non-existing email');
  });
});