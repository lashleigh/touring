class Place < Locatable
  include MongoMapper::Document

  key :venue_id, String
  key :name, String

  # location details
  key :city, String
  key :country, String
  key :postal, Integer
  key :state, String

  # contact details
  key :phone, String
  key :url, String

  # category and amenities
  key :category_ids, Array
  key :categories, Array
  key :amenities, Array

  # ratings
  key :voters, Array
  key :num_votes, Integer
  key :rating, Float

  #relations to other models
  #key :day_ids, Array

  many :users, :in => :voters

  def self.nearest(coords)
    where(:coords => {'$near' => coords}).limit(1).first
  end
  def self.nearest_with_phone(coords)
    where(:coords => {'$near' => coords}, :phone => {'$ne' => nil}).limit(1).first
  end
  def self.find_all_within_bounds(bounds) 
    where(:coords => {'$within' => {'$box' => bounds}}).all
  end

  def self.find_all_by_category(c)
    where(:categories => c).all
  end

  def import_from_fq(fq)
    Place.set({:id => id.as_json},
      :venue_id => fq["id"],
      :name => fq["name"],
      :url => fq["url"],
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
