class Waypoint
  include MongoMapper::Document

  key :venue_id, String
  key :name, String

  # location details
  key :city, String
  key :address, String
  key :country, String
  key :coords, Array
  key :postal, Integer
  key :state, String
  key :phone, String

  #category and amenities
  key :categories, Array
  key :amenities, Array

  #ratings
  key :voters, Array
  key :num_votes, Integer
  key :rating, Float

  #relations to other models
  #key :day_ids, Array

  many :users, :in => :voters
  ensure_index [[:coords,'2d']]

  def import_from_fq(fq)
    Waypoint.set({:id => id.as_json},
      :venue_id => fq["id"],
      :name => fq["name"],
      :city => fq["location"]["city"],
      :address => fq["location"]["address"],
      :country => fq["location"]["country"],
      :coords => [fq["location"]["lat"].to_f,fq["location"]["lng"].to_f],
      :postal => fq["location"]["postalCode"],
      :state => fq["location"]["state"],
      :phone => fq["contact"]["formattedPhone"] ? fq["contact"]["formattedPhone"] : fq["contact"]["phone"],
      :categories => fq["category_array"]
    )
  end

end

