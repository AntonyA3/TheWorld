<?php

    $x = $_GET['x'];
    $y = $_GET['y'];
    $z = $_GET['z'];
    $mag = sqrt($x * $x + $y * $y + $z * $z);
  
    $dbconn = pg_connect("host=localhost port=5432 user=postgres dbname=world password=pepe") or die('connection failed');
    $query = 'select x,y,z,title from threads 
        order by acos(
            (x * '.$x. '+ y * '.$y.' + z * '.$z.')/
            ('.$mag.' * sqrt(x * x + y * y + z * z))) limit 10'
    ;
    $result = pg_query($dbconn, $query) or die("Error in SQL query: " . pg_last_error());
    $list = pg_fetch_all($result, PGSQL_ASSOC);

    echo json_encode($list);

    
    pg_free_result($result);
    pg_close($dbconn);



    
    
         
