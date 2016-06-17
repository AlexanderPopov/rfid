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
