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

  many :users, :in => :voters

  def import_from_fq(fq)
    Waypoint.set({:id => id.as_json},
      :venue_id => fq.id,
      :name => fq.name,
      :city => fq.location["city"],
      :address => fq.location["address"],
      :country => fq.location["country"],
      :coords => [fq.location["lat"],fq.location["lng"]],
      :postal => fq.location["postalCode"],
      :state => fq.location["state"],
      :phone => fq.contact["formattedPhone"] ? fq.contact["formattedPhone"] : fq.contact["phone"],
      :categories => fq.categories.map {|c| c.name }
    )
  end

end

