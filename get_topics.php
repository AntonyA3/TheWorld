<?php

$dbconn = pg_connect("host=localhost port=5432 user=postgres dbname=world password=pepe") or die('connection failed');
$result = pg_query($dbconn, 'select code,name from topics') or die("Error in SQL query: " . pg_last_error());
$list = pg_fetch_all($result, PGSQL_ASSOC);

echo json_encode($list);

pg_free_result($result);
pg_close($dbconn);

?>