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
  'transaction_type',
  'is_counted'
], { is_counted: 'false' });

Transaction.list = function(cb) {
  var query = 
  `
SELECT 
	t1.*, 
	CASE
		WHEN t1.sender_type = 10 THEN c_s.last_name || ' ' || c_s.name
		WHEN t1.sender_type = 0 THEN 'ИП "' || f_s.name || '"'
		WHEN t1.sender_type = 1 THEN 'ООО "' || f_s.name || '"'
		WHEN t1.sender_type = 2 THEN 'МУП "' || f_s.name || '"'
		WHEN t1.sender_type = 100 THEN 'Бюджет'
		ELSE ''
	END AS sender_name,
	CASE
		WHEN t1.receiver_type = 10 THEN c_r.last_name || ' ' || c_r.name
		WHEN t1.receiver_type = 0 THEN 'ИП "' || f_r.name || '"'
		WHEN t1.receiver_type = 1 THEN 'ООО "' || f_r.name || '"'
		WHEN t1.receiver_type = 2 THEN 'МУП "' || f_r.name || '"'
		WHEN t1.receiver_type = 100 THEN 'Бюджет'
		ELSE ''
	END AS receiver_name
	, receiver_type
FROM 
	transact t1 
		left join citizen c_s 
			on c_s.card_id = t1.sender 
		left join firm f_r 
			on f_r.id = t1.receiver
		left join citizen c_r
			on c_r.card_id = t1.receiver
		left join firm f_s 
			on f_s.id = t1.sender
ORDER BY
	t1.dt DESC
;
  `;

  this.db.serialize(() => {
    this.db.all(query, cb);
  });
};

Transaction.ANPcount = function(cb) {
  var query = `
SELECT 
	date(t1.dt) as dt, 
  sum(t1.base_sum) AS sum,
	CASE
		WHEN t1.sender_type = 10 THEN c_s.region_id
		WHEN t1.sender_type = 0 THEN f_s.region_id
		WHEN t1.sender_type = 1 THEN f_s.region_id
		WHEN t1.sender_type = 2 THEN f_s.region_id
		ELSE 0
	END AS region,
	CASE
		WHEN t1.sender_type = 10 THEN c_r.name
		WHEN t1.sender_type = 0 THEN f_r.name
		WHEN t1.sender_type = 1 THEN f_r.name
		WHEN t1.sender_type = 2 THEN f_r.name
		ELSE 0
	END AS region_name
FROM 
	transact t1 
		left join citizen c_s 
			on c_s.card_id = t1.sender 
		left join firm f_s 
			on f_s.id = t1.sender
		left join region c_r 
			on c_r.id = c_s.region_id
		left join region f_r 
			on f_r.id = f_s.region_id
WHERE
  transaction_type = 5
GROUP BY
  3,
  1
ORDER BY
	t1.dt DESC
  `;
  this.db.serialize(() => {
    this.db.all(query, cb);
  });
};

Transaction.PITcount = function(cb) {
  var query = `
SELECT 
	date(t1.dt) AS dt,
  sum(t1.base_sum) AS sum,
	CASE
		WHEN t1.sender_type = 10 THEN c_s.region_id
		WHEN t1.sender_type = 0 THEN f_s.region_id
		WHEN t1.sender_type = 1 THEN f_s.region_id
		WHEN t1.sender_type = 2 THEN f_s.region_id
		ELSE 0
	END AS region,
	CASE
		WHEN t1.sender_type = 10 THEN c_r.name
		WHEN t1.sender_type = 0 THEN f_r.name
		WHEN t1.sender_type = 1 THEN f_r.name
		WHEN t1.sender_type = 2 THEN f_r.name
		ELSE 0
	END AS region_name
FROM 
	transact t1 
		left join citizen c_s 
			on c_s.card_id = t1.sender 
		left join firm f_s 
			on f_s.id = t1.sender
		left join region c_r 
			on c_r.id = c_s.region_id
		left join region f_r 
			on f_r.id = f_s.region_id
WHERE
  transaction_type = 6
GROUP BY
  3,
  1
ORDER BY
	t1.dt DESC
  `;
  this.db.serialize(() => {
    this.db.all(query, cb);
  });
};

Transaction.selectNotCountedSum = function(region_id, cb) {
  var trans_select = `
SELECT
  sum(t1.base_sum) AS sum,
	CASE
		WHEN t1.sender_type = 10 THEN c_s.region_id
		WHEN t1.sender_type = 0 THEN f_s.region_id
		WHEN t1.sender_type = 1 THEN f_s.region_id
		WHEN t1.sender_type = 2 THEN f_s.region_id
		ELSE 0
	END AS region
FROM
	transact t1 
		left join citizen c_s 
			on c_s.card_id = t1.sender 
		left join firm f_s 
			on f_s.id = t1.sender
WHERE
  (t1.transaction_type = 5
  OR t1.transaction_type = 6)
  AND t1.is_counted = 'false'
  AND (c_s.region_id = ? OR f_s.region_id = ?)
GROUP BY
  2
  `;

  this.db.serialize(() => {
    this.db.get(trans_select, [region_id, region_id], cb);
  });
}

Transaction.updateCounted = function(cb) {
  var query = `
    UPDATE transact set is_counted = 'true';
  `;
  this.db.run(query, cb);
}

module.exports = Transaction;
