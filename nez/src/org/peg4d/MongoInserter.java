/**
 *
 */
package org.peg4d;

import java.net.UnknownHostException;
import java.util.ArrayList;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.util.JSON;

public class MongoInserter {

	public MongoClient client;
	public DB db;
	public String parseResultJSON = "";

	public MongoInserter(){
		try {
			this.client = new MongoClient("localhost", 27017);
			this.db = client.getDB("peg4d");
		} catch (UnknownHostException e) {
			e.printStackTrace();
		}
	}

	public void InsertJSON(){
		DBCollection member = db.getCollection("member");
		DBObject data = (DBObject) JSON.parse(parseResultJSON);
		member.insert(data);
	}

	public void Insert(ParsingObject pego){
		BasicDBObject doc = ConvertToDBObject(pego);
		DBCollection member = db.getCollection("member");
		member.insert(doc);
	}

	public BasicDBObject ConvertToDBObject(ParsingObject pego){
		BasicDBObject doc = new BasicDBObject("tag", pego.getTag().toString());
		if(pego.size() > 0){
			if(pego.size() > 1){
				doc.append("value", ConvertToArrayList(pego));
			} else {
				doc.append("value", ConvertToDBObject(pego));
			}
		} else {
			doc.append("value", pego.getText());
		}
		return doc;
	}

	public ArrayList ConvertToArrayList(ParsingObject pego){
		ArrayList array = new ArrayList();
		for(int i = 0; i < pego.size(); i++){
			array.add(ConvertToDBObject(pego.get(i)));
		}
		return array;
	}
}

