const Model = require('./base');

var Transaction = new Model('transact', [
  'id',
  'sender',
  'sender_type',
  'receiver',
  'receiver_type',
  'dt',
  'base_sum',
  'sender_sum',
  'receiver_sum',
  'sender_course',
  'receiver_course',
  'transaction_type'
], {});

module.exports = Transaction;
