curl -X POST "localhost:8080/queues/1/consumers?callback_url=json999.com";

curl -X POST "localhost:8080/queues/1/consumers?callback_url=grepawk.com";

curl "localhost:8080/queues/1/consumers";

curl -X DELETE "localhost:8080/queues/1/consumers/1";

curl -X POST "localhost:8080/queues/1/messages?body=hello+world"
