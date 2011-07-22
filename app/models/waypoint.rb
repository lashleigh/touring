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

  def import_from_fq(fq)
    venue_id = fq.id
    name = fq.name
    city = fq.location["city"]
    address = fq.location["address"]
    coords[0] = fq.location["lat"]
    coords[1] = fq.location["lng"]
    postal = fq.location["postalCode"]
    phone = fq.contact["formattedPhone"]
    state = fq.location["state"]
    unless categories.include? fq.categories[0].name
      categories.push(fq.categories[0].name)
    end
  end

end

