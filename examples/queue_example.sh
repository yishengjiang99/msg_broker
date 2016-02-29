curl -X POST "localhost:8080/queues?name=queue_one";

curl -X POST "localhost:8080/queues?name=queue_two";

curl localhost:8080/queues;

curl -X PUT "localhost:8080/queues/2?name=edited_two";

curl localhost:8080/queues;

curl -X DELETE "localhost:8080/queues/2";
