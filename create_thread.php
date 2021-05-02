<?php
    $x = $_POST['x'];
    $y = $_POST['y'];
    $z = $_POST['z'];
    $title = $_POST['title'];
    $topic = $_POST['topic'];
    $content = $_POST['content'];
    $timestamp = $_POST['timestamp'];

    $dbconn = pg_connect("host=localhost port=5432 user=postgres dbname=world password=pepe") or die('connection failed');
    $count = 0;
    $query = 'select count(title) from threads 
        where x='.$x.'and y='.$y.'and z='.$z;
    
    $result = pg_query($dbconn, $query) or die("Error in SQL query: " . pg_last_error());
    $obj = pg_fetch_object($result);
    $count = $obj->count;
    pg_free_result($result);

    if($count == 0){
        $query = 'insert into threads(x,y,z,title,topic,content,timestamp)
        values('.$x.','.$y.','.$z.','.$title.','.$topic.','.$content.','.$timestamp.')';
        $result = pg_query($dbconn, $query) or die("Error in SQL query: " . pg_last_error());
        pg_free_result($result);
        echo "success";
        
    }else{
        echo "invalid location";
    }
    pg_close($dbconn);



    
    
