import { MongoClient } from "mongodb";
async function run() {
  const uri = "mongodb://localhost:27017/?directConnection=true";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("session-combat-test");
  const char = await db.collection("characters").findOne({});
  console.log(char);
  await client.close();
}
run();
